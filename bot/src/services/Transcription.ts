
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


//まとめて送りつけるパケット数(1パケットの長さはだいたい20ms)
const SEND_PACKET_NUM = 10

export class TranscriptionWriteStream extends Writable{
    protected packetList : DiscordOpusPacketList | null = null
    constructor(
        protected api_bi_stream : grpc.ClientDuplexStream<DiscordOpusPacketList,TranscriptionEvent>,
        protected speaker_id: string,
        protected prompt: string = "",
        protected save_to_file: string | null = null
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
        process.stdout.write(is_final ? "!" : ".")
        
        // 保存する場合は、送らずクリアもしない
        if(this.save_to_file !== null) return null

        if(!this.api_bi_stream.write(this.packetList)){
            //err = new Error("write error")
            console.error("write error")
        }
        this.packetList = null
        return null
    }

    _final(callback: (error?: Error | null) => void): void {
        this._flush(true)
        if(this.save_to_file !== null && this.packetList !== null){
            console.log("write to file",this.save_to_file)
            // this.packetListをファイルに書き出す
            writeFileSync(this.save_to_file,
                    Buffer.from(this.packetList.serializeBinary()),
                    {encoding:"binary"})
        }
        callback()
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
            console.log("from server",response.toObject())
            try {
                emitter.emit(
                        response.getEventname(),
                        JSON.parse(response.getEventdata())
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

    async startListen(connection: VoiceConnection,channel: VoiceChannel) : Promise<void>{
        const logger = await resolveDependency(Logger)
        const receiver = connection.receiver;
        receiver.speaking.on('start', async (userId) => {
            const member = channel.guild.members.cache.get(userId) as GuildMember
            if(this.listeningStatus[userId]) return
            if(member){
                logger.log(`listen start ${member.displayName}(${member.user.username})`,"info")
                this.listeningStatus[userId] = true
                await this.listen(connection,member)
                this.listeningStatus[userId] = false
                logger.log(`listen end ${member.displayName}(${member.user.username})`,"info")
            }
        })
    }
    async stopListen() : Promise<void>{
        this.api_stream?.end()
        this.api_stream=null
    }
        
    protected async listen(connection: VoiceConnection,member: GuildMember){
        const user = member.user
        if(this.api_stream === null){
            await this.connectApi(this.emitter)
        }
        const write_stream = new TranscriptionWriteStream(this.api_stream as any,user.id,'アルトさん、地獄さん、ユハナさん、サムゲタン')

        const logger = await resolveDependency(Logger)
        logger.log(`speaking start ${member.displayName}(${user.username})`,"info")
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
