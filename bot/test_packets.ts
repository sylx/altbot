import * as fs from "node:fs"
import * as grpc from "@grpc/grpc-js"
import "reflect-metadata"
import { TranscriptionClient } from "./grpc/transcription_grpc_pb"
import { TranscriptionWriteStream } from "./src/services/Transcription"
import { TranscribedText } from "grpc/transcription_pb"

const client = new TranscriptionClient(
    "localhost:1234",
    grpc.credentials.createInsecure()
)
const api_stream=client.transcriptionBiStreams()
console.log("connect")
const packet_length = [175,191,163,152,155,156,149,146,152,157,174,165,151,146,148,156,165,161,151,155,164,163,153,155,164,159,175,180,172,154,150,156,153,160,161,156,158,161,164,152,152,154,153,152,149,149,147,150,156,155,157,154,150,176,201,191,179,174,168,164,165,168,168,172,163,167,177,172,179,175,173,182,174,163,170,162,161,172,166,163,167,180,184,162,157,162,160,148,155,160,162,159,154,151,152,154,156,153,144,145,142,137,140,141,134,142,137,130,146,149,149,129,145,130,163,171,147,164,167,182,176,170,161,178,175,178,183,174,171,158,156,187,184,166,165,173,178,157,151,158,159,157,167,180,174,168,173,159,156,164,178,176,170,168,152,160,159,160,154,156,146,144,147,132,126]
const opusData = fs.readFileSync("../ai-service/test.bin")

const packets=[0,1,2,3].map(i=>{
    return packet_length.map((length,i)=>{
        const start = packet_length.slice(0,i).reduce((a,b)=>a+b,0)
        const end = start + length
        return opusData.subarray(start,end)
    })
}).flat()

const writeStream = new TranscriptionWriteStream(api_stream,"test")

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
    api_stream.on("data",(response : TranscribedText)=>{
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
            begin: toDate(response.getBegin()),
            end: toDate(response.getEnd()),
            packet_timestamp: response.getPacketTimestamp(),
            speaker_id: response.getSpeakerId(),
            text: response.getText()
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

