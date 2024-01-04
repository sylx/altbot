import * as grpc from "@grpc/grpc-js";

import "reflect-metadata";
import { TranscriptionClient } from "./grpc/transcription_grpc_pb";
import { OpusEncoder } from "@discordjs/opus";
import { DiscordOpusPacketList, DiscordOpusPacket, KeywordSpottingRequest, KeywordSpottingConfigRequest, KeywordSpottingAudioRequest, KeywordSpottingResponse } from "./grpc/transcription_pb";
import fs from "node:fs";
import { once } from "events";

const encoder = new OpusEncoder(48000, 2);  

const client = new TranscriptionClient(
    `${process.env.AI_SERVICE_HOST ?? "localhost"}:${process.env.AI_SERVICE_PORT ?? 1234}`,
    grpc.credentials.createInsecure()
)

const api_stream = client.keywordSpotting()

if(!api_stream){
    throw new Error("api_stream is null")
}

async function receiveResponse(){
    for await (const response of api_stream){
        console.log("from server",JSON.stringify(response.toObject()))
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

async function setKeyword() : Promise<void>{
    const keywords=["アルト","あると","サムゲタン","？","まちがえた"]
    const req=new KeywordSpottingRequest()
    const config = new KeywordSpottingConfigRequest()
    config.setKeywordList(keywords)
    req.setConfig(config)
    api_stream.write(req)
    const response=await (once(api_stream,"data") as Promise<KeywordSpottingResponse[]>)
    console.log("config result?",response.length,response[0].toObject())    
}

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(){
    // Keywordを設定
    await setKeyword()
    //受信ループを開始
    receiveResponse()    
    const packets=generatePackets("dump-jigoku3dayu-1696511950609.bin")
    for(let i in packets){
        const packet=packets[i]
        const req=new KeywordSpottingRequest()
        const audio = new KeywordSpottingAudioRequest()
        audio.addData(packet)
        audio.setSpeakerId("test")
        req.setAudio(audio)
        req.setIsFinal(parseInt(i) === packets.length-1)
        api_stream.write(req)
        process.stderr.write(".")
        await wait(20)
    }
    await wait(500)
    api_stream.end()
}

main()

