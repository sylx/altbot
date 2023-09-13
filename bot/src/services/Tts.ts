
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
    protected player : AudioPlayer
    protected subscription : PlayerSubscription | null = null
    protected playQueue : Array<Readable> = []
    protected isPlaying = false
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

    async playNextInQueue(): Promise<void> {
        if (!this.isPlaying && this.playQueue.length > 0) {
            const nextItem = this.playQueue.shift() as Readable;
            this.isPlaying = true;
            const resource= createAudioResource(nextItem, {
                inputType: StreamType.OggOpus,
            })
            this.player.play(resource)
            await entersState(this.player, AudioPlayerStatus.Playing, 5_000)
            await entersState(this.player, AudioPlayerStatus.Idle, 2 ** 31 - 1)
            this.isPlaying = false;
            await this.playNextInQueue();
        }
    }

    abort() : void{
        this.player.stop()
        this.playQueue=[]
        this.isPlaying=false
    }


    async subscribe() : Promise<void>{
        const connection=this.voiceChat.getConnection()
        if(connection === null) throw "yet join voice channel"

        await entersState(connection, VoiceConnectionStatus.Ready, 20e3)
        console.log("subscribe")
        const subscription=connection.subscribe(this.player)
        const observer = (oldState: VoiceConnectionState, newState: VoiceConnectionState) : void =>{
            if(newState.status === VoiceConnectionStatus.Destroyed){
                this.subscription=null
            }
        }
        connection.on("stateChange", observer)

        if(subscription){
            this.subscription=subscription
        }else{
            throw "player subscribe error"
        }
    }

    async speak(text: string) : Promise<void>{
        if(this.subscription === null){
            await this.subscribe()
        }
        if(this.subscription?.connection){
            await entersState(this.subscription?.connection, VoiceConnectionStatus.Ready, 3000)
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
                console.log("queue",this.playQueue.length,response.getText())
                this.playQueue.push(oggStream)
                // 再生中でなければ、すぐに再生を開始
                if (!this.isPlaying) {
                    this.playNextInQueue();
                }                
            }
        }).on("end", async () => {
            console.log("recieve end")
        }).on("error", (err) => {
            console.error(err)
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
