
import * as grpc from "@grpc/grpc-js"
import { delay, inject, singleton,injectable } from "tsyringe"
import { TtsClient } from "../../grpc/tts_grpc_pb"

import {
    AudioPlayer,
    createAudioResource, StreamType, entersState, AudioPlayerStatus
} from "@discordjs/voice"


import { TtsSpeakRequest, TtsSpeakResponse, TtsSpeakerInfoList, TtsSpeakerSelect } from "../../grpc/tts_pb"
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb"

import { Readable } from "stream"
import { VoiceChat } from "./VoiceChat"

interface TtsSpeakOptions {
    useCache?: boolean,
    silent?: boolean,
    imediate?: boolean
}

@singleton()
@injectable()
export class Tts {
    public client : TtsClient
    public playQueue : Array<Readable> = []
    protected isPlaying : boolean = false
    protected cache : Map<string,Buffer> = new Map()
    constructor(
        @inject(delay(() => VoiceChat)) private voiceChat: VoiceChat,
    ) {
        this.connect().then((client)=>{
            console.log("connected tts server")
        })
    }
    protected async connect(): Promise<TtsClient> {
        this.client=new TtsClient(
            `${process.env.AI_SERVICE_HOST}:${process.env.AI_SERVICE_PORT}`,
            grpc.credentials.createInsecure()
          )
        return new Promise((resolve, reject) => {
            this.client.waitForReady(Date.now() + 10000, (err) => {
                if(err){
                    reject(err)
                }else{
                    resolve(this.client)
                }
            })
        })
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
            //console.log("playend queue",this.playQueue.length)
            await this.playNextInQueue();
        }else{
            console.log("queue is empty")
        }
    }

    abort() : void{
        this.getPlayer().stop()
        this.playQueue=[]
    }


    speak(text: string,option?: TtsSpeakOptions) : Promise<void>{
        if(!this.voiceChat.isEnable()){
            throw new Error("not connected voice channel")
        }
        let imediate=option?.imediate 
        if(option?.useCache){
            const buffer=this.cache.get(text)
            if(buffer && option?.silent !== true){
                console.log("from cache",text)
                const stream = Readable.from(buffer)
                // if(imediate === true){
                //     imediate=false
                //     this.getPlayer().stop()
                //     this.playQueue=[]
                //     this.isPlaying=false
                // }
                this.playQueue.push(stream)
                return this.playNextInQueue();
            }
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
                    if(option?.useCache){
                        this.cache.set(text,buffer)
                    }
                    console.log("queue",this.playQueue.length,response.getText())
                    if(option?.silent !== true){
                        // if(imediate === true){
                        //     imediate=false
                        //     this.getPlayer().stop()
                        //     this.playQueue=[]
                        // }
                        this.playQueue.push(oggStream)
                        await this.playNextInQueue()
                    }
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
