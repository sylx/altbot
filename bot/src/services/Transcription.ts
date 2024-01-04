import * as grpc from "@grpc/grpc-js"
import { delay, inject } from "tsyringe"
import { GuildMember } from "discord.js"
import { TranscriptionClient } from "../../grpc/transcription_grpc_pb"
import {
    KeywordSpottingConfigRequest,
    TranscriptionAudioRequest,
    TranscriptionCloseRequest,
    TranscriptionConfigRequest,
    TranscriptionEventResponse,
    TranscriptionRequest,TranscriptionResponse
} from "../../grpc/transcription_pb"
import { AudioReceiveStream, EndBehaviorType } from "@discordjs/voice"
import { EventEmitter } from "events"
import { IGuildDependent, PromiseAllDynamic, guildScoped } from "@utils/functions"
import { VoiceChat } from "./VoiceChat"
import { once } from "events"

export type TranscriptionEvent = {
    text: string
    speaker_id: string
    probability: number
    info: {[key: string]: any}
    timestamp: number
}

type UserStream = {
    user_id: string
    stream: AudioReceiveStream
}


type ApiStream=grpc.ClientDuplexStream<TranscriptionRequest,TranscriptionResponse>

const CHUNK_SIZE = 5

@guildScoped()
export class Transcription implements IGuildDependent{
    public client : TranscriptionClient
    protected listeningStatus : {[key: string]: boolean} = {}

    constructor(
        @inject(delay(() => VoiceChat)) private voiceChat: VoiceChat,
    ) {
        this.client=new TranscriptionClient(
            `${process.env.AI_SERVICE_HOST}:${process.env.AI_SERVICE_PORT}`,
            grpc.credentials.createInsecure()
          )
    }
    protected connectApi() : ApiStream{
        return this.client.transcription()
    }
    getGuildId(): string | null {
        return this.voiceChat.getGuildId()
    }
    // wait_for_eventがtrueの場合は、現在解析中の内容を最後まで受け取ってから終了する
    protected abort(api_stream: ApiStream,streams: UserStream[],wait_for_event?: boolean) : void{
        if(wait_for_event){
            this.closeApiConnection(api_stream,true).then(()=>{
                this.listeningStatus = {}
                api_stream.end()
                streams.forEach(stream=>{
                    stream.stream.removeAllListeners()
                    stream.stream.destroy()
                })        
            })
            return
        }
        this.listeningStatus = {}
        api_stream.end()
        streams.forEach(stream=>{
            stream.stream.removeAllListeners()
            stream.stream.destroy()
        })
    }

    protected async closeApiConnection(api_stream: ApiStream,is_abort?: boolean) : Promise<void>{
        // send closeRequest
        const req=new TranscriptionRequest()
        const close=new TranscriptionCloseRequest()
        close.setIsAbort(is_abort ?? false)
        req.setClose(close)
        api_stream.write(req)

        // 向こうからcloseされるのを待つ
        await once(api_stream,"close")
    }


    protected getKeywordConfig(keyword: string[],threshold: number) : KeywordSpottingConfigRequest{
        const config = new KeywordSpottingConfigRequest()
        config.setKeywordList(keyword)
        config.setThreshold(threshold)
        return config
    }

    protected getOpusStream(member: GuildMember,timeout: number | null) : UserStream{
        const connection = this.voiceChat.getConnection()
        if(!connection){
            throw new Error("voice connection is null")
        }
        const receiver = connection.receiver;
        return {
            user_id: member.id,
            stream: receiver.subscribe(member.id, {
                end: timeout ? {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: timeout,
                } : {
                    behavior: EndBehaviorType.Manual
                }
            })
        } as UserStream
    }

    //送信ループを開始する
    public async startListenStream(stream: UserStream,api_stream: ApiStream) : Promise<void>{
        const user_id=stream.user_id
        try {
            let audio_request : TranscriptionAudioRequest | null=null
            let is_closed=false
            stream.stream.on("end",()=>{
                console.log("opus stream end")
                //flush
                if(audio_request !== null){
                    const req=new TranscriptionRequest()
                    audio_request.setForceFlush(true)
                    req.setAudio(audio_request)
                    api_stream.write(req)
                    audio_request=null
                }
                is_closed=true
            })

            for await (const packet of stream.stream){
                if(is_closed) break
                if(audio_request === null){
                    audio_request = new TranscriptionAudioRequest()
                    audio_request.setSpeakerId(user_id)            
                }
                audio_request.addData(packet)
                if(audio_request.getDataList().length >= CHUNK_SIZE){
                    //flush
                    const req=new TranscriptionRequest()
                    req.setAudio(audio_request)
                    api_stream.write(req)
                    audio_request=null
                }
            }
        }catch(e: any){
            //abortするとここに来る
            console.error(e)
            stream.stream.removeAllListeners()
            stream.stream.destroy(e)
        }
    }

    protected async sendConfig(api_stream: ApiStream,prompt: string,keyword?: string[]) : Promise<boolean>{
        const config=new TranscriptionConfigRequest()
        config.setPrompt(prompt)
        config.setReturnOpus(false)
        config.setReturnWords(false)
        if(keyword && keyword.length > 0){
            config.setKwsConfig(this.getKeywordConfig(keyword,0.5))
        }
        const req=new TranscriptionRequest()
        req.setConfig(config)
        api_stream.write(req)
        const response: TranscriptionResponse[] = await once(api_stream,"data")
        const config_response=response[0].getConfig()
        if(config_response && config_response.getSuccess()){
            return true
        }
        return false
    }

    public async start(prompt: string,keyword: string[],listen_members: GuildMember[],emitter: EventEmitter,abortController : AbortController) : Promise<void>{
        const api_stream=await this.connectApi()
        const connection = this.voiceChat.getConnection()
        if(!connection){
            throw new Error("voice connection is null")
        }
        const channel=this.voiceChat.getChannel()
        if(!channel){
            throw new Error("voice channel is null")
        }

        const streams=listen_members.map(member=>this.getOpusStream(member,null))

        // abortハンドラを設定
        abortController.signal.addEventListener("abort",()=>{
            this.abort(api_stream,streams,true)
        })
        // api_streamのエラーハンドラを設定
        api_stream.on("error",(e)=>{
            this.abort(api_stream,streams)
            throw e
        })
        // config
        if(!await this.sendConfig(api_stream,prompt,keyword)){
            throw new Error("config failed")
        }
        emitter.emit("ready")

        //送信ループ
        const listen_promises=streams.map(stream=>this.startListenStream(stream,api_stream))

        //受信ループ
        const receive_promise=(async function(){
            try {
                api_stream.on("close",()=>{
                    is_closed=true
                })
                let is_closed=false
                for await (const response of api_stream){
                    if(is_closed) break
                    if(response.hasEvent()){
                        const event_response : TranscriptionEventResponse =response.getEvent()
                        emitter.emit("transcription",{
                            text: event_response.getText(),
                            speaker_id: event_response.getSpeakerId(),
                            probability: event_response.getProbability(),
                            info: JSON.parse(event_response.getInfo()),
                            timestamp: event_response.getTimestamp()
                        } as TranscriptionEvent)
                    }
                }
            }catch(e){
                //abortするとここに来る                
                console.error(e)
            }
        })()
        // 送信が全て終わるまで待つ（abortした場合は、streamが死ぬので、どっちにしろ終わる)
        await PromiseAllDynamic<void>(listen_promises)
        // 受信が終わるまで待つ
        await this.closeApiConnection(api_stream)
    }
}

