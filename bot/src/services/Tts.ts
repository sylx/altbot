
import * as grpc from "@grpc/grpc-js"
import { delay, inject, singleton } from "tsyringe"
import { TtsClient } from "../../grpc/tts_grpc_pb"

import {
    VoiceConnection, createAudioPlayer,AudioPlayer,
    createAudioResource, StreamType,
    VoiceConnectionStatus, entersState,
    AudioPlayerStatus, getVoiceConnections, PlayerSubscription,
} from "@discordjs/voice"


import { TtsSpeakRequest,TtsSpeakResponse } from "../../grpc/tts_pb"
import { Readable } from "stream"
import { VoiceChat } from "./VoiceChat"
import { connect } from "http2"

@singleton()
export class Tts {
    public client : TtsClient
    protected player : AudioPlayer
    protected subscription : PlayerSubscription | null = null
    constructor(
        @inject(delay(() => VoiceChat)) private voiceChat: VoiceChat,
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
    getPlayer() : AudioPlayer{
        return this.player
    }

    async speak(text: string) : Promise<void>{
        if(this.subscription === null){
            const connection=this.voiceChat.getConnection()
            if(connection === null) throw "yet join voice channel"
            console.log("subscribe")
            const subscription=connection.subscribe(this.player)
            if(subscription){
                this.subscription=subscription
            }else{
                throw "player subscribe error"
            }
        }
        const playQueue : Array<Readable> = [];
        let isPlaying = false;
        let isStreamEnd = false;

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
            isStreamEnd = true
        }).on("error", (err) => {
            console.error(err)
        })
    }
}
