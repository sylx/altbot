
import * as grpc from "@grpc/grpc-js"
import { delay, inject, singleton } from "tsyringe"
import { TtsClient } from "../../grpc/tts_grpc_pb"

import {
    VoiceConnection, createAudioPlayer,AudioPlayer,
    createAudioResource, StreamType,
    VoiceConnectionStatus, entersState,VoiceConnectionState,
    AudioPlayerStatus, getVoiceConnections, PlayerSubscription,
} from "@discordjs/voice"


import { TtsSpeakRequest,TtsSpeakResponse,TtsSpeakerInfoList,TtsSpeakerSelect } from "../../grpc/tts_pb"
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

import { Readable } from "stream"
import { VoiceChat } from "./VoiceChat"

@singleton()
export class Tts {
    public client : TtsClient
    protected playQueue : Array<Readable> = []
    protected isPlaying : boolean = false
    constructor(
        @inject(delay(() => VoiceChat)) private voiceChat: VoiceChat,
    ) {
        this.client=new TtsClient(
            "localhost:1234",
            grpc.credentials.createInsecure()
          )
    }
    getClient() : TtsClient{
        return this.client
    }
    getPlayer() : AudioPlayer{
        return this.voiceChat.getPlayer()
    }
    async playNextInQueue(): Promise<void> {
        if(this.isPlaying) return
        if(this.playQueue.length > 0) {
            this.isPlaying=true
            const nextItem = this.playQueue[0];
            const resource= createAudioResource(nextItem, {
                inputType: StreamType.OggOpus,
            })
            this.getPlayer().play(resource)
            await entersState(this.getPlayer(), AudioPlayerStatus.Playing, 5_000)
            await new Promise(resolve => {
                this.getPlayer().once(AudioPlayerStatus.Idle, resolve)
            })
            //ここで再生が終わった
            this.playQueue.shift()
            this.isPlaying=false
            console.log("playend queue",this.playQueue.length)
            await this.playNextInQueue();
        }else{
            console.log("queue empty")
        }
    }

    abort() : void{
        this.getPlayer().stop()
        this.playQueue=[]
    }


    speak(text: string) : Promise<void>{
        if(!this.voiceChat.isEnable()){
            throw new Error("not connected voice channel")
        }
        const req = new TtsSpeakRequest()
        req.setText(text)
        const stream=this.client.speakStream(req)

        return new Promise((resolve, reject) => {
            stream.on("data", async (response : TtsSpeakResponse) => {
                const audio = response.getAudio()
                console.log("from server",response.getText(),audio.length)            
                if(audio){
                    // UInt8Array to buffer
                    const buffer = Buffer.from(audio)
                    // buffer to stream
                    const oggStream = Readable.from(buffer)
                    console.log("queue",this.playQueue.length,response.getText())
                    this.playQueue.push(oggStream)
                    this.playNextInQueue();
                }
            }).on("end", async () => {
                console.log("recieve end")
                await entersState(this.getPlayer(), AudioPlayerStatus.Idle, 2 ** 31 - 1)
                resolve()
            }).on("error", (err) => {
                console.error(err)
                reject(err)
            })
        })
    }

    getSpeakersInfo(): Promise<TtsSpeakerInfoList> {
        return new Promise((resolve, reject) => {
            const empty=new google_protobuf_empty_pb.Empty()
            this.client.getSpeakers(empty, (err, response) => {
                if(err){
                    reject(err)
                }else{
                    resolve(response)
                }
            })
        })
    }
    setSpeaker(speakerId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const req = new TtsSpeakerSelect()
            req.setIndex(speakerId)
            this.client.setSpeaker(req, (err, response) => {
                if(err){
                    reject(err)
                }else{
                    resolve()
                }
            })
        })
    }
}
