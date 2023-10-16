import * as fs from "node:fs"
import * as grpc from "@grpc/grpc-js"
import "reflect-metadata"
import { TtsClient } from "./grpc/tts_grpc_pb"
import { TtsSpeakRequest,TtsSpeakResponse} from "./grpc/tts_pb"
import Speaker from "speaker"
import { OpusEncoder } from "@discordjs/opus"
import { Readable } from "node:stream"
import { propertiesMapper } from "@tsed/schema"
import { opus } from "prism-media"

const speaker = new Speaker({
    channels: 2,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 48000     
  });
const encoder = new OpusEncoder(48000, 2);  

async function main(){
    const client = new TtsClient(
        "localhost:1234",
        grpc.credentials.createInsecure()
    )
    await new Promise((resolve, reject) => {
        client.waitForReady(Date.now() + 10000, (err) => {
            if(err){
                reject(err)
            }else{
                resolve(client)
            }
        })
    })
    const req = new TtsSpeakRequest()
    // CLEANED a↑aa↓aa.
    //req.setText("[NOISEW=0.0][CLEANED]aaiaaiaaiaai.")
    //req.setText("[CLEANED]aaa↑iiiuuueeee↑ooo.")
    req.setText("アルトさんこんにちは。これは合成音声のテストですよ。")
    
    const stream=client.speakStream(req)
    let duration = 0
    await new Promise((resolve,reject)=>{
        stream.on("data",(res:TtsSpeakResponse)=>{
            const oggOpusBuffer=Buffer.from(res.getAudio())
            const oggOpusStream = new Readable({
                read() {
                    this.push(oggOpusBuffer)
                    this.push(null)
                }
            })
            const demuxer = new opus.OggDemuxer()
            demuxer.on("data",(packet)=>{
                const samplesDecoded = encoder.decode(packet);
                duration += samplesDecoded.length / 48000 / 2 * 1000
                speaker.write(samplesDecoded)
            }).on("error",(err)=>{
                console.error(err)
            })
            oggOpusStream.pipe(demuxer)
        })
        stream.on("end",()=>{
            resolve(null)
        })
        stream.on("error",(err)=>{
            reject(err)
        })
    })
    console.log(`playing ${duration}ms`)
    await new Promise(resolve => setTimeout(resolve, duration));
}

main()
