
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
    
    async speak(text: string) : Promise<void>{
        if(this.connection === null) return
        await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000)

        const playQueue : Array<Readable> = [];
        let isPlaying = false;

        const playNextInQueue=async () => {
            if (!isPlaying && playQueue.length > 0) {
                const nextItem = playQueue.shift() as Readable;
                isPlaying = true;
                const resource= createAudioResource(nextItem, {
                    inputType: StreamType.OggOpus,
                })
                this.player.play(resource)
                await entersState(this.player, AudioPlayerStatus.Playing, 5_000)
                await entersState(this.player, AudioPlayerStatus.Idle, 2 ** 31 - 1)
                isPlaying = false;
                await playNextInQueue();
            }
        }

        const req = new TtsSpeakRequest()
        req.setText(text)
        const stream=this.client.speakStream(req)
        stream.on("data", async (response : TtsSpeakResponse) => {
            const audio = response.getAudio()
            console.log("from server",response.getText(),audio.length)            
            if(audio){
                // UInt8Array to buffer
                const buffer = Buffer.from(audio)
                // buffer to stream
                const oggStream = Readable.from(buffer)
                playQueue.push(oggStream)
                // 再生中でなければ、すぐに再生を開始
                if (!isPlaying) {
                    playNextInQueue();
                }                
            }
        }).on("end", async () => {
        }).on("error", (err) => {
            console.error(err)
        })
    }
}
