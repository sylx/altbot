
import * as grpc from "@grpc/grpc-js"
import { GuildMember, User } from "discord.js"
import { delay, inject, singleton } from "tsyringe"
import { TranscriptionClient } from "../../grpc/transcription_grpc_pb"
import { VoiceAudio, TranscribedText,DiscordOpusPacket,DiscordOpusPacketList } from "../../grpc/transcription_pb"
import { Writable } from "stream"
import { T } from "ts-toolbelt"

//まとめて送りつけるパケット数(1パケットの長さはだいたい20ms)
const SEND_PACKET_NUM = 10 

export class TranscriptionWriteStream extends Writable{
    protected packetList : DiscordOpusPacketList | null = null
    constructor(
        protected api_bi_stream : grpc.ClientDuplexStream<DiscordOpusPacketList,TranscribedText>,
        protected speaker_id: string
    ){ 
        super()
    }

    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        if(this.packetList === null){
            this.packetList = new DiscordOpusPacketList()
        }
        const packet = new DiscordOpusPacket()
        packet.setData(chunk)
        packet.setSpeakerId(this.speaker_id)
        // now(milliseconds)
        packet.setTimestamp(Date.now())
        this.packetList.addPackets(packet)
        let err: Error | null = null
        if(this.packetList.getPacketsList().length >= SEND_PACKET_NUM){
            err = this._flush(false)
            this.packetList = null
        }
        callback(err)        
    }

    _flush(is_final : boolean): Error | null {
        if(this.packetList === null){
            this.packetList = new DiscordOpusPacketList() //empty
        }
        let err: Error | null = null
        this.packetList.setIsFinal(is_final)
        //console.log("flush",is_final ? "final" : "",this.packetList.getPacketsList().length,"packets")
        process.stdout.write(is_final ? "!" : ".")
        if(!this.api_bi_stream.write(this.packetList)){
            //err = new Error("write error")
            console.error("write error")
        }
        return null
    }

    _final(callback: (error?: Error | null) => void): void {
        this._flush(true)
        callback()
    }
}

@singleton()
export class Transcription {
    public client : TranscriptionClient
    constructor(
    ) {
        this.client=new TranscriptionClient(
            "localhost:1234",
            grpc.credentials.createInsecure()
          )
    }
    getClient() : TranscriptionClient{
        return this.client
    }
}
