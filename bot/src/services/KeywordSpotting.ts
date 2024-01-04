
import * as grpc from "@grpc/grpc-js"
import { delay, inject } from "tsyringe"
import { GuildMember } from "discord.js"
import { TranscriptionClient } from "../../grpc/transcription_grpc_pb"
import {
    KeywordSpottingFoundEventResponse, KeywordSpottingFound, KeywordSpottingRequest,
    KeywordSpottingAudioRequest, KeywordSpottingConfigRequest, KeywordSpottingResponse
} from "../../grpc/transcription_pb"
import { AudioReceiveStream, EndBehaviorType } from "@discordjs/voice"
import { EventEmitter } from "events"
import { IGuildDependent, guildScoped } from "@utils/functions"
import { VoiceChat } from "./VoiceChat"
import { once } from "events"

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

    protected async setKeyword(api_stream: ApiStream,keyword: string[],threshold: number) : Promise<boolean>{
        const req=new KeywordSpottingRequest()
        const config = new KeywordSpottingConfigRequest()
        config.setKeywordList(keyword)
        config.setThreshold(threshold)
        req.setConfig(config)
        api_stream.write(req)
        const response=await (once(api_stream,"data") as Promise<KeywordSpottingResponse[]>)
        console.log("config result?",response.length,response[0].toObject())
        return response[0]?.getConfig()?.getSuccess() ?? false
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

    public async start(keyword: string[],threshold: number,listen_members: GuildMember[],emitter: EventEmitter,abortController : AbortController) : Promise<void>{
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
            this.abort(api_stream,streams)
        })
        // api_streamのエラーハンドラを設定
        api_stream.on("error",(e)=>{
            this.abort(api_stream,streams)
            throw e
        })
        // キーワードを設定
        if(!await this.setKeyword(api_stream,keyword,threshold)){
            throw new Error("keyword setting failed")
        }
        emitter.emit("ready")

        // 送信ループ
        const submit_promises=(function(){
            return streams.map(async (stream)=>{
                const user_id=stream.user_id
                try {
                    for await (const packet of stream.stream){
                        const req=new KeywordSpottingRequest()
                        const audio = new KeywordSpottingAudioRequest()
                        audio.addData(packet)
                        audio.setSpeakerId(user_id)
                        req.setAudio(audio)
                        api_stream.write(req)
                    }
                }catch(e){
                    //abortするとここに来る
                    console.error(e)
                }
            })
        })()
        //受信ループ
        const receive_promises=(async function(){
            try {
                let last_found_timeout : {[key: string]: NodeJS.Timeout} = {}
                for await (const response of api_stream){
                    console.log("from server",JSON.stringify(response.toObject()))
                    const foundResponse : KeywordSpottingFoundEventResponse | null = response.getFound()
                    if(foundResponse){
                        const found : KeywordSpottingFound[] = foundResponse.getFoundList()
                        if(found.length === 0) continue
                        for(let f of found){
                            const found_id = f.getId(), found_keyword = f.getKeyword()
                            if(last_found_timeout[found_id]){
                                continue
                            }
                            if(last_found_timeout[found_keyword]){
                                continue
                            }
                            emitter.emit("found",{
                                keyword: f.getKeyword(),
                                speaker_id: foundResponse.getSpeakerId(),
                                text: foundResponse.getDecoderText(),
                                probability: f.getProbability(),
                                timestamp: Date.now()
                            } as KeywordSpottingFoundEvent)
                            last_found_timeout[found_id]=setTimeout(()=>{
                                delete last_found_timeout[found_id]
                            },1000)
                            last_found_timeout[found_keyword]=setTimeout(()=>{
                                delete last_found_timeout[found_keyword]
                            },3000)
                        }
                    }
                }
            }catch(e){
                //abortするとここに来る                
                console.error(e)
            }
        })()
        await Promise.all([...submit_promises,receive_promises])
    }
}
