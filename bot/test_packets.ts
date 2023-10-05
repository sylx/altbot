import * as fs from "node:fs"
import * as grpc from "@grpc/grpc-js"
import "reflect-metadata"
import { TranscriptionClient } from "./grpc/transcription_grpc_pb"
import { DiscordOpusPacketList,DiscordOpusPacket,TranscriptionEvent } from "./grpc/transcription_pb"
import { TranscriptionWriteStream } from "./src/services/Transcription"
import { P } from "ts-toolbelt/out/Object/_api"
import { BinaryReader } from "google-protobuf"

const client = new TranscriptionClient(
    "localhost:1234",
    grpc.credentials.createInsecure()
)

function generatePackets(filename: string,repeat?: number): Array<any>{
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
        return Buffer.from(packet.getData())
    })
    }).flat()
}

// waitを入れながら送信する
async function send(packets: Array<any>,writeStream : TranscriptionWriteStream){
    for(let p of packets){
        process.stdout.write(".")
        writeStream.write(p)
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    // writeStreamへの書き込みが終了したことを伝える
    writeStream.end()
}

const prompt = "アルト、サムゲタン"

async function streamTest(speaker_id: string,packets: Array<any>,delay: number){
    const api_stream = client.transcriptionBiStreams()
    const writeStream = new TranscriptionWriteStream(api_stream,speaker_id,prompt)

    const api_promise = new Promise((resolve,reject)=>{
        api_stream.on("data",(response : TranscriptionEvent)=>{
            //millisecond unix time to date(format YYYY/MM/DD hh:mm:ss.ms)
            const toDate = (millisecond : number) => {
                const date = new Date(millisecond)
                const year = date.getFullYear()
                const month = date.getMonth() + 1
                const day = date.getDate()
                const hour = date.getHours()
                const minute = date.getMinutes()
                const second = date.getSeconds()
                const milli = date.getMilliseconds()
                return `${year}/${month}/${day} ${hour}:${minute}:${second}.${milli}`
            }
            console.log("response",{
                eventName: response.getEventname(),
                eventData: JSON.parse(response.getEventdata())
            })
        }).on("end",()=>{
            console.log("api read end")
            resolve()
        })
    }) as Promise<void>
    
    //delayミリ秒待つ
    await new Promise(resolve => setTimeout(resolve, delay));
    await Promise.all([
        api_promise,
        send(packets,writeStream)
    ])
}


Promise.all([
    streamTest("test-0",generatePackets("dump-jigoku3dayu-1696511950609.bin"),0),
    //streamTest("test-1",generatePackets("dump-jigoku3dayu-1696511968012.bin"),3000),
]).then(()=>{
    console.log("end")
    process.exit(0)
})

