import * as fs from "node:fs"
import * as grpc from "@grpc/grpc-js"
import "reflect-metadata"
import { TranscriptionClient } from "./grpc/transcription_grpc_pb"
import { DiscordOpusPacketList,DiscordOpusPacket,TranscriptionEvent } from "./grpc/transcription_pb"
import { TranscriptionWriteStream } from "./src/services/Transcription"
import Speaker from "speaker"
import { OpusEncoder } from "@discordjs/opus"
import prism from "prism-media"
import { Writable } from "@tsed/core"
import { Readable, Stream } from "node:stream"

const speaker = new Speaker({
    channels: 2,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 48000     
  });
const encoder = new OpusEncoder(48000, 2);  
 
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
        //const samplesDecoded = encoder.decode(p);      
        //speaker.write(samplesDecoded)
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    // writeStreamへの書き込みが終了したことを伝える
    writeStream.end()
}

const prompt = "アルト、サムゲタン"

async function streamTest(speaker_id: string,packets: Array<any>,delay: number){
    const api_stream = client.transcriptionBiStreams()
    const writeStream = new TranscriptionWriteStream(api_stream,speaker_id,prompt)

    const transcribedAudio: {[key: string]: any} = {}
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
            const name = response.getEventname()
            const data = JSON.parse(response.getEventdata())
            process.stdout.write("\n")
            switch(name){
                case "transcription":
                    console.log("transcription",{
                        ids: data.ids,
                        speaker_id: data.speaker_id,
                        begin: toDate(data.begin),
                        end: toDate(data.end),
                        duration: data.end - data.begin,
                        packet_timestamp: toDate(data.packet_timestamp),
                        text: data.text
                    })
                    data.ids.forEach((id : string)=>{
                        transcribedAudio[id]= {
                            id: id,
                            packet_timestamp: data.packet_timestamp,
                            text: data.text,
                            duration: data.end - data.begin,
                            opus: response.getOpusdata_asU8()
                        }
                    })
                    break
                case "vad":
                    console.log("vad",{
                        id: data.id,
                        speaker_id: data.speaker_id,
                        timestamp: toDate(data.timestamp),
                        duration: data.duration
                    })
                    break
                default:
                    console.log("response",{
                        eventName: name,
                        eventData: data
                    })
                    break
            }
        }).on("end",async ()=>{
            console.log("api read end")
            //transcribedAudioを順に再生する
            const funcs : Array<any>=Object.values(transcribedAudio).sort((a,b)=>a.packet_timestamp-b.packet_timestamp).map((data)=>{
                return ()=>{
                    return new Promise((resolve,reject)=>{
                        console.log(`playing ${data.id} ${data.text}`)
                        // buffer to stream                
                        const oggOpusBuffer=Buffer.from(data.opus)
                        const oggOpusStream = new Readable({
                            read() {
                                this.push(oggOpusBuffer)
                                this.push(null)
                            }
                        })
                        const demuxer = new prism.opus.OggDemuxer();
                        demuxer.on("data", (buffer) => {
                            const samplesDecoded = encoder.decode(buffer);      
                            speaker.write(samplesDecoded)
                            setTimeout(resolve, data.duration + 1000)
                        }).on("end",()=>{
                        }).on("error",(err)=>{
                            reject(err)
                        })
                        oggOpusStream.pipe(demuxer)
                    })
                }
            })
            for(let func of funcs){
                await func()
            }
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
    //streamTest("test-0",generatePackets("dump-jigoku3dayu-1696511950609.bin"),0),
    //streamTest("test-1",generatePackets("dump-jigoku3dayu-1696511968012.bin"),0),
    streamTest("test-2",generatePackets("dump-jigoku3dayu-1696551798341.bin"),0),
]).then(()=>{
    console.log("end")
    process.exit(0)
})
