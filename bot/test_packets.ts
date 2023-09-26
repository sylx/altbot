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
const api_stream=client.transcriptionBiStreams()
console.log("connect")
console.log("read from",process.argv[process.argv.length - 1])
const binary = fs.readFileSync(process.argv[process.argv.length - 1])
console.log("binary",binary.length,binary.subarray(0,10))
const packetList = DiscordOpusPacketList.deserializeBinary(binary)

console.log("packetList",packetList.getPacketsList().length)
const packets=[0,1,2,3].map(i=>{
    return packetList.getPacketsList().map((packet : DiscordOpusPacket)=>{
        return Buffer.from(packet.getData())
    })
}).flat()

console.log("packets",packets.length)

const writeStream = new TranscriptionWriteStream(api_stream,"test","アルト、サムゲタン")

// waitを入れながら送信する
async function send(){
    for(let p of packets){
        process.stdout.write(".")
        writeStream.write(p)
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    // writeStreamへの書き込みが終了したことを伝える
    writeStream.end()
}

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

const write_promise = new Promise((resolve,reject)=>{
    send().then(()=>{
        resolve()
    })
}) as Promise<void>

Promise.all([api_promise,write_promise]).then(()=>{
    console.log("end")
    process.exit(0)
})

