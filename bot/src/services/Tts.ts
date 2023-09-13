
import * as grpc from "@grpc/grpc-js"
import { delay, inject, singleton } from "tsyringe"
import { TtsClient } from "../../grpc/tts_grpc_pb"

import {
    VoiceConnection, createAudioPlayer,AudioPlayer,
    createAudioResource, StreamType,
    VoiceConnectionStatus, entersState,
    AudioPlayerStatus, getVoiceConnections,
} from "@discordjs/voice"

import { TtsSpeakRequest,TtsSpeakResponse } from "../../grpc/tts_pb"
import { Readable } from "stream"

@singleton()
export class Tts {
    public client : TtsClient
    protected player : AudioPlayer
    protected connection : VoiceConnection | null = null
    constructor(
    ) {
        this.client=new TtsClient(
            "localhost:1234",
            grpc.credentials.createInsecure()
          )
        this.player = createAudioPlayer({
            debug: true
        })
    }
    getClient() : TtsClient{
        return this.client
    }
    setConnection(connection: VoiceConnection) : void{
        this.connection=connection
        connection.subscribe(this.player)
    }

    getPlayer() : AudioPlayer{
        return this.player
    }
    async waitForPlayerIdle() : Promise<AudioPlayer>{
        return entersState(this.player, AudioPlayerStatus.Idle, 2 ** 31 - 1)
    }
    async speak(text: string) : Promise<void>{
        if(this.connection === null) return
        await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000)

        const req = new TtsSpeakRequest()
        req.setText(text)
        const stream=this.client.speakStream(req)
        stream.on("data", async (response : TtsSpeakResponse) => {
            const audio = response.getAudio()
            console.log("from server",response.getText(),audio.length)            
            if(audio){
                //play audio
                // 前回の再生が終わるまで待つ
                await this.waitForPlayerIdle()
                // UInt8Array to stream
                const oggStream = Readable.from(audio)
                const resource= createAudioResource(oggStream, {
                    inputType: StreamType.OggOpus,
                })
                this.player.play(resource)
                //ここで終わると、再生が始まる前に次の再生が始まる可能性がある（？本当？）
                await entersState(this.player, AudioPlayerStatus.Playing, 5_000)
            }        
        }).on("end", async () => {
        }).on("error", (err) => {
            console.error(err)
        })
    }
}
