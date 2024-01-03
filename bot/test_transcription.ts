import * as grpc from "@grpc/grpc-js";

import "reflect-metadata";
import { TranscriptionClient } from "./grpc/transcription_grpc_pb";
import { OpusEncoder } from "@discordjs/opus";
import { DiscordOpusPacketList, DiscordOpusPacket,
    KeywordSpottingRequestConfig,
    TranscriptionRequest,TranscriptionRequestConfig,TranscriptionRequestAudio,TranscriptionResponse,TranscriptionConfigResponse,TranscriptionEventResponse, TranscriptionCloseRequest
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
let whole_text : {[key: string]: string[]}={}
let probs : {[key: string]: number[]}={}

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
            const words=event.getWordsList() ?? []
            const speaker_id=event.getSpeakerId()
            if(!whole_text[speaker_id]){
                whole_text[speaker_id]=[]
                probs[speaker_id]=[]
            }
            whole_text[speaker_id].push(event.getText())
            probs[speaker_id].push(event.getProbability())
            console.log("event",{
                speaker_id: event.getSpeakerId(),
                text: event.getText(),
                words: words.map(word=>word.toObject()),
                info: JSON.parse(event.getInfo())
            })
        }
        if(response.hasClose()){
            const close=response.getClose()
            console.log("close",close.toObject())
            break
        }
    }
    console.log("receiveResponse end")
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

async function sendConfig() : Promise<void>{
    const prompt="日常会話"
    const keywords=["アルト","サムゲタン","ディープステート"]
    const req=new TranscriptionRequest()
    const config = new TranscriptionRequestConfig()
    const kw_config = new KeywordSpottingRequestConfig()
    config.setPrompt(prompt)
    kw_config.setKeywordList(keywords)
    config.setKwsConfig(kw_config)
    config.setReturnOpus(false)
    config.setReturnWords(false)
    req.setConfig(config)
    api_stream.write(req)
    const response=await (once(api_stream,"data") as Promise<TranscriptionConfigResponse[]>)
    console.log("config result?",response.length,response[0].toObject())    
}

function sendClose() : void{
    const req=new TranscriptionRequest()
    const close_req=new TranscriptionCloseRequest()
    close_req.setIsAbort(false)
    req.setClose(close_req)
    api_stream.write(req)
}

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sendRequest(dumpfile: string,wait_msec: number,speaker_id: string){
    await wait(wait_msec)
    const packets=generatePackets(dumpfile)
    console.log(`start ${speaker_id} ${dumpfile} ${packets.length} packets`)
    for(let i in packets){
        const packet=packets[i]
        const req=new TranscriptionRequest()
        const audio = new TranscriptionRequestAudio()
        audio.addData(packet)
        audio.setSpeakerId(speaker_id)
        audio.setForceFlush(parseInt(i) == packets.length-1)
        req.setAudio(audio)
        api_stream.write(req)
        process.stderr.write(".")
        await wait(20)
    }
}

async function main(){
    // Keywordを設定
    await sendConfig()
    await Promise.all([
        receiveResponse(),
        (async ()=>{
            await Promise.all([
                sendRequest("dump-jigoku3dayu-1696551798341.bin",0,"test1"),
                sendRequest("dump-jigoku3dayu-1696511968012.bin",500,"test2"),
                sendRequest("dump-jigoku3dayu-1696511950609.bin",1000,"test3")
            ])
            sendClose()
        })()
    ])
    console.log("whole_text",whole_text)
    console.log("probs",probs)
}

main()

