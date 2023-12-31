
import * as grpc from "@grpc/grpc-js"
import { delay, inject } from "tsyringe"
import { GuildMember, VoiceChannel } from "discord.js"
import { singleton } from "tsyringe"
import { TranscriptionClient } from "../../grpc/transcription_grpc_pb"
import { KeywordSpottingFoundEventResponse, KeywordSpottingFound,KeywordSpottingRequest,
     KeywordSpottingRequestAudio, KeywordSpottingRequestConfig, KeywordSpottingResponse } from "../../grpc/transcription_pb"
import { AudioReceiveStream, EndBehaviorType, VoiceConnection } from "@discordjs/voice"
import { EventEmitter } from "events"
import { IGuildDependent, guildScoped, resolveDependency } from "@utils/functions"
import { Logger } from "./Logger"
import { VoiceChat } from "./VoiceChat"
import {once} from "events"

export type KeywordSpottingFoundEvent = {
    keyword: string    
    speaker_id: string    
    text: string
    probability: number,
    timestamp: number
}

type UserStream = {
    user_id: string
    stream: AudioReceiveStream
}

type ApiStream=grpc.ClientDuplexStream<KeywordSpottingRequest,KeywordSpottingResponse>

@guildScoped()
export class KeywordSpotting implements IGuildDependent{
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
        return this.client.keywordSpotting()
    }
    getGuildId(): string | null {
        return this.voiceChat.getGuildId()
    }
    protected abort(api_stream: ApiStream,streams: UserStream[]) : void{
        this.listeningStatus = {}
        api_stream.end()
        streams.forEach(stream=>{
            stream.stream.destroy()
        })
    }

    protected async setKeyword(api_stream: ApiStream,keyword: string[]) : Promise<boolean>{
        const req=new KeywordSpottingRequest()
        const config = new KeywordSpottingRequestConfig()
        config.setKeywordList(keyword)
        req.setConfig(config)
        api_stream.write(req)
        const response=await (once(api_stream,"data") as Promise<KeywordSpottingResponse[]>)
        console.log("config result?",response.length,response[0].toObject())
        return response[0]?.getConfig()?.getSuccess() ?? false
    }

    protected getOpusStream(member: GuildMember,timeout: number) : UserStream{
        const connection = this.voiceChat.getConnection()
        if(!connection){
            throw new Error("voice connection is null")
        }
        const receiver = connection.receiver;
        
        return {
            user_id: member.id,
            stream: receiver.subscribe(member.id, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: timeout,
                },
            })
        } as UserStream
    }

    public async start(keyword: string[],listen_members: GuildMember[],emitter: EventEmitter,abortController : AbortController) : Promise<void>{
        const api_stream=await this.connectApi()
        const connection = this.voiceChat.getConnection()
        if(!connection){
            throw new Error("voice connection is null")
        }
        const streams=listen_members.map(member=>this.getOpusStream(member,10_000))

        // abortハンドラを設定
        abortController.signal.addEventListener("abort",()=>{
            this.abort(api_stream,streams)
        })
        // キーワードを設定
        if(!await this.setKeyword(api_stream,keyword)){
            throw new Error("keyword setting failed")
        }

        // 送信ループ
        const submit_promises=(function(){
            return streams.map(async (stream)=>{
                const user_id=stream.user_id
                try {
                    for await (const packet of stream.stream){
                        const req=new KeywordSpottingRequest()
                        const audio = new KeywordSpottingRequestAudio()
                        audio.addData(packet)
                        audio.setSpeakerId(user_id)
                        req.setAudio(audio)
                        api_stream.write(req)
                    }
                }catch(e){
                    console.error(e)
                }
            })
        })()
        //受信ループ
        const receive_promises=(async function(){
            try {
                for await (const response of api_stream){
                    console.log("from server",JSON.stringify(response.toObject()))
                    const foundResponse : KeywordSpottingFoundEventResponse | null = response.getFound()
                    if(foundResponse){
                        const found : KeywordSpottingFound[] = foundResponse.getFoundList()
                        if(found.length === 0) continue
                        for(let f of found){
                            console.log("emit")
                            emitter.emit("found",{
                                keyword: f.getKeyword(),
                                speaker_id: foundResponse.getSpeakerId(),
                                text: foundResponse.getDecoderText(),
                                probability: f.getProbability(),
                                timestamp: Date.now()
                            } as KeywordSpottingFoundEvent)
                        }
                    }
                }
            }catch(e){
                console.error(e)
            }
        })()
        await Promise.all([...submit_promises,receive_promises])
    }
}
