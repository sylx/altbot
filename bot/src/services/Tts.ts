
import * as grpc from "@grpc/grpc-js"
import { delay, inject, singleton,injectable } from "tsyringe"
import { TtsClient } from "../../grpc/tts_grpc_pb"

import {
    AudioPlayer,
    createAudioResource, StreamType, entersState, AudioPlayerStatus
} from "@discordjs/voice"


import { TtsSpeakRequest, TtsSpeakResponse, TtsSpeakerInfoList } from "../../grpc/tts_pb"
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb"

import { Readable } from "stream"
import { VoiceChat,Database } from "@services"
import { Data } from "@entities"

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
    protected defaultSpeakerId: number = 1
    constructor(
        protected abortController: AbortController,
        @inject(delay(() => VoiceChat)) private voiceChat: VoiceChat,
        @inject(delay(() => Database)) private db: Database,
    ) {
        this.connect().then((client)=>{
            console.log("connected tts server")
        })
        const dataRepository = db.get(Data)
        dataRepository.get('ttsDefaultSpeakerId').then((speaker_id) => {
            if(speaker_id){
                this.defaultSpeakerId=speaker_id
            }
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

    getClient(): TtsClient {
        return this.client;
    }

    getPlayer(): AudioPlayer {
        return this.voiceChat.getPlayer();
    }

    setDefaultSpeakerId(speaker_id: number): void {
        this.defaultSpeakerId=speaker_id
        const dataRepository = this.db.get(Data)
        dataRepository.set('ttsDefaultSpeakerId',speaker_id)
    }

    getDefaultSpeakerId(): number {
        return this.defaultSpeakerId
    }

    protected async playNextInQueue(): Promise<void> {
        if(this.isPlaying) return
        if(this.playQueue.length > 0) {
            this.isPlaying=true
            const nextItem = this.playQueue[0];
            const resource= createAudioResource(nextItem, {
                inputType: StreamType.OggOpus,
            })
            this.getPlayer().play(resource)
            await entersState(this.getPlayer(), AudioPlayerStatus.Playing,this.abortController.signal)
            console.log("waiting...")
            await entersState(this.getPlayer(), AudioPlayerStatus.Idle, this.abortController.signal)
            //ここで再生が終わった?
            this.playQueue.shift()
            this.isPlaying=false
            await this.playNextInQueue();
        }else{
            console.log("queue is empty",this.getPlayer().state.status)
        }
    }

    abort(): void {
        console.log("abort");
        this.getPlayer().stop();
        this.playQueue = [];
        this.isPlaying = false;
        this.abortController.abort();
        this.abortController = new AbortController();
    }

    async speak(text: string,speaker_id?: number | null,option?: TtsSpeakOptions) : Promise<void>{
        if(!this.voiceChat.isEnable()){
            throw new Error("not connected voice channel")
        }
        if(option?.imediate) this.abort()
        if(option?.useCache){
            const buffer=this.cache.get(text)
            if(buffer && option?.silent !== true){
                console.log("from cache",text)
                const stream = Readable.from(buffer)
                this.playQueue.push(stream)
                await this.playNextInQueue()
                return Promise.resolve()
            }
        }
        const req = new TtsSpeakRequest()
        req.setText(text)
        req.setSpeakerId(speaker_id || this.defaultSpeakerId)
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
                        this.playQueue.push(oggStream)
                        if(!this.isPlaying){
                            this.playNextInQueue()
                        }
                    }
                }
            }).on("end", async () => {
                //これ以降queueが追加されることはないが、まだ再生中かもしれない
                do{
                    await entersState(this.getPlayer(), AudioPlayerStatus.Idle, this.abortController.signal)
                }while(this.playQueue.length > 0)
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
}
