
import * as grpc from "@grpc/grpc-js"
import { GuildMember, User, VoiceChannel } from "discord.js"
import { delay, inject, singleton } from "tsyringe"
import { TranscriptionClient } from "../../grpc/transcription_grpc_pb"
import { TranscriptionEvent,DiscordOpusPacket,DiscordOpusPacketList } from "../../grpc/transcription_pb"
import { Writable } from "stream"
import { EndBehaviorType, VoiceConnection } from "@discordjs/voice"
import { EventEmitter } from "events"
import { resolveDependency } from "@utils/functions"
import { Logger } from "./Logger"
import { writeFile, writeFileSync } from "fs"
import { Data, NgWord } from "@entities"
import { Database } from "./Database"


//まとめて送りつけるパケット数(1パケットの長さはだいたい20ms)
const SEND_PACKET_NUM = 20

export class TranscriptionWriteStream extends Writable{
    protected packetList : DiscordOpusPacketList | null = null
    protected packetDump : Array<DiscordOpusPacket> = []
    constructor(
        protected api_bi_stream : grpc.ClientDuplexStream<DiscordOpusPacketList,TranscriptionEvent> | null,
        protected speaker_id: string,
        protected prompt: string = "",
        protected keepPacket: boolean = false
    ){ 
        super()
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        if(this.packetList === null){
            this.packetList = new DiscordOpusPacketList()
        }
        const packet = new DiscordOpusPacket()
        packet.setData(Uint8Array.from(chunk))
        // now(milliseconds)
        packet.setTimestamp(Date.now())
        this.packetList.addPackets(packet)
        let err: Error | null = null
        if(this.packetList.getPacketsList().length >= SEND_PACKET_NUM){
            err = this._flush(false)
        }
        callback(err)
    }

    _flush(is_final : boolean): Error | null {
        if(this.packetList === null){
            this.packetList = new DiscordOpusPacketList() //empty
        }
        let err: Error | null = null
        this.packetList.setIsFinal(is_final)
        this.packetList.setSpeakerId(this.speaker_id)
        this.packetList.setPrompt(this.prompt)
        //console.log("flush",is_final ? "final" : "",this.packetList.getPacketsList().length,"packets")
        //process.stdout.write(is_final ? "!" : ".")
        

        if(this.api_bi_stream){
            if(!this.api_bi_stream.write(this.packetList)){
                //err = new Error("write error")
                console.error("write error")
            }
        }
        if(this.keepPacket){
            this.packetList.getPacketsList().forEach((packet)=>{
                this.packetDump.push(packet)
            })
        }
        this.packetList = null
        return null
    }

    _final(callback: (error?: Error | null) => void): void {
        this._flush(true)
        callback()
    }
    //一つのpacketListにまとめて返す
    getPacketDump() : Buffer{
        const packet_list=new DiscordOpusPacketList()
        this.packetDump.map((packet)=>{
            packet_list.addPackets(packet)
        })
        //一応
        packet_list.setSpeakerId(this.speaker_id)
        packet_list.setPrompt(this.prompt)
        packet_list.setIsFinal(true)
        return Buffer.from(packet_list.serializeBinary())
    }
}

@singleton()
export class Transcription {
    public client : TranscriptionClient
    protected emitter: EventEmitter = new EventEmitter()
    protected api_stream : grpc.ClientDuplexStream<DiscordOpusPacketList,TranscriptionEvent> | null = null
    protected listeningStatus : {[key: string]: boolean} = {}

    constructor(
    ) {
        this.client=new TranscriptionClient(
            "localhost:1234",
            grpc.credentials.createInsecure()
          )
    }
    on(event: string, listener: (...args: any[]) => void) : void{
        this.emitter.on(event,listener)
    }
    async connectApi(emitter: EventEmitter) : Promise<void>{
        if(this.api_stream !== null) throw new Error("already connected")

        this.api_stream = this.client.transcriptionBiStreams()
        this.api_stream?.on("error", (err) => {
            console.error(err)
            this.api_stream = null
        })
        .on("data", (response : TranscriptionEvent) => {
            //console.log("from server",response.getEventname(),response.getEventdata(),response.getOpusdata().length)
            try {
                const data=JSON.parse(response.getEventdata())
                data.opusData=response.getOpusdata()
                emitter.emit(
                        response.getEventname(),
                        data
                )
            } catch (e) {
                console.error(e)
            }
        })
        .on("end", () => {
            console.log("api read end")
            this.api_stream = null
        })
    }

    async startListen(connection: VoiceConnection,channel: VoiceChannel,prompt: string | Function) : Promise<void>{
        const logger = await resolveDependency(Logger)
        const receiver = connection.receiver;
        receiver.speaking.on('start', async (userId) => {
            const member = channel.guild.members.cache.get(userId) as GuildMember
            if(this.listeningStatus[userId]) return
            if(member){
                logger.log(`listen start ${member.displayName}(${member.user.username})`,"info")
                this.listeningStatus[userId] = true
                const prompt_str = typeof prompt === "function" ? await prompt() : prompt
                await this.listen(connection,member,prompt_str)
                this.listeningStatus[userId] = false
                logger.log(`listen end ${member.displayName}(${member.user.username})`,"info")
            }
        })
    }

    getPacketDump(connection: VoiceConnection,member: GuildMember) : Promise<Buffer>{
        let already_listen = false
        return new Promise((resolve,reject)=>{
            const receiver = connection.receiver;            
            receiver.speaking.once('start', async (userId) => {
                if(userId !== member.user.id) return
                if(already_listen) return
                console.log("write start")
                already_listen = true
                const write_stream = new TranscriptionWriteStream(null as any,userId,"",true)
                const opusStream=receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 3000,
                    },  
                })
                opusStream
                .pipe(write_stream as TranscriptionWriteStream)
                .on("finish",async ()=>{
                    console.log("write end")
                    already_listen = false
                    resolve(write_stream.getPacketDump())
                })
                .on("error",(err)=>{
                    console.error(err)
                    reject(err)
                })
            })
        })
    }

    async stopListen() : Promise<void>{
        this.api_stream?.end()
        this.api_stream=null
    }
        
    protected async listen(connection: VoiceConnection,member: GuildMember,prompt: string = ""){
        const user = member.user
        if(this.api_stream === null){
            await this.connectApi(this.emitter)
        }
        const write_stream = new TranscriptionWriteStream(this.api_stream as any,user.id,prompt)

        const receiver = connection.receiver;
        const opusStream=receiver.subscribe(user.id, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 500,
            },
        })
        return new Promise((resolve,reject)=>{
            opusStream
                .pipe(write_stream as TranscriptionWriteStream)
                .on("finish",async ()=>{
                    console.log("write end")
                    resolve()
                })
                .on("error",(err)=>{
                    console.error(err)
                    reject(err)
                })
        }) as Promise<void>
    }
}
