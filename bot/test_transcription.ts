import * as grpc from "@grpc/grpc-js";

import "reflect-metadata";
import { TranscriptionClient } from "./grpc/transcription_grpc_pb";
import { OpusEncoder } from "@discordjs/opus";
import { DiscordOpusPacketList, DiscordOpusPacket,
    KeywordSpottingRequestConfig,
    TranscriptionRequest,TranscriptionRequestConfig,TranscriptionRequestAudio,TranscriptionResponse,TranscriptionConfigResponse,TranscriptionEventResponse
 } from "./grpc/transcription_pb";
import fs from "node:fs";
import { once } from "events";

const encoder = new OpusEncoder(48000, 2);  

const client = new TranscriptionClient(
    `${process.env.AI_SERVICE_HOST ?? "localhost"}:${process.env.AI_SERVICE_PORT ?? 1234}`,
    grpc.credentials.createInsecure()
)

const api_stream = client.transcription()

if(!api_stream){
    throw new Error("api_stream is null")
}

let opus_index=0
let whole_text : string[]=[]
let probs : number[]=[]

async function receiveResponse(){
    for await (const response of api_stream){
        if(response.hasEvent()){
            const event=response.getEvent() as TranscriptionEventResponse
            const opus_data=event.getOpusdata_asU8()
            if(opus_data && opus_data.length > 0){
                const filename=`opus-${opus_index++}.ogg`
                fs.writeFile(filename,opus_data,(err)=>{
                    console.log("write",filename)
                })
            }
            whole_text.push(event.getText())
            probs.push(event.getProbability())
            console.log("event",{
                speaker_id: event.getSpeakerId(),
                text: event.getText(),
                words: event.getWordsList().map(word=>word.toObject()),
                info: JSON.parse(event.getInfo())
            })
        }
    }
}

function generatePackets(filename: string,repeat?: number): Array<Uint8Array>{
    const binary = fs.readFileSync(filename)
    const packetList = DiscordOpusPacketList.deserializeBinary(binary)
    const seq=[0]
    if(repeat && repeat > 1){
        for(let i=1;i<repeat;i++){
            seq.push(i)
        }
    }
    return seq.map(i=>{
        return packetList.getPacketsList().map((packet : DiscordOpusPacket)=>{
            return packet.getData() as Uint8Array
        })
    }).flat()
}

async function config() : Promise<void>{
    const prompt="日常会話"
    const keywords=["アルト","サムゲタン","ディープステート"]
    const req=new TranscriptionRequest()
    const config = new TranscriptionRequestConfig()
    const kw_config = new KeywordSpottingRequestConfig()
    config.setPrompt(prompt)
    kw_config.setKeywordList(keywords)
    config.setKwsConfig(kw_config)
    config.setReturnOpus(false)
    req.setConfig(config)
    api_stream.write(req)
    const response=await (once(api_stream,"data") as Promise<TranscriptionConfigResponse[]>)
    console.log("config result?",response.length,response[0].toObject())    
}

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(){
    // Keywordを設定
    await config()
    //受信ループを開始
    receiveResponse()    
    const packets=generatePackets("./dump-jigoku3dayu-1696551798341.bin")
    for(let i in packets){
        const packet=packets[i]
        const req=new TranscriptionRequest()
        const audio = new TranscriptionRequestAudio()
        audio.addData(packet)
        audio.setSpeakerId("test")
        req.setAudio(audio)
        req.setIsFinal(parseInt(i) === packets.length-1)
        api_stream.write(req)
        process.stderr.write(".")
        await wait(20)
    }
    await wait(2000)
    api_stream.end()
    console.log("end",whole_text.join("_"),probs.reduce((a,b)=>a+b,0)/probs.length)
}

main()

