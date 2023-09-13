import { GuildMember, User } from "discord.js"
import { VoiceConnection,EndBehaviorType } from "@discordjs/voice";

import { VoiceAudio, transcribedText } from "../../../grpc/transcription_pb"

import * as prism from "prism-media"
import { Logger } from "@services"
import { resolveDependency } from "@utils/functions"
import { Transcription } from "../../services/Transcription";
import { Tts } from "../../services/Tts";


type ListeningStatus = {
    listening: boolean,
    user: User,
    timeout: NodeJS.Timeout | null,
}

let listeningStatus: {[key: string]: ListeningStatus} = {}


export async function listen(connection: VoiceConnection,user: User,member: GuildMember){
        
    if(listeningStatus[user.id] && listeningStatus[user.id].listening){
        console.log(`already listening ${user.username}`)
        return
    }
    if(!listeningStatus[user.id]){
        listeningStatus[user.id]={listening: false,user: user,timeout: null}
    }
    listeningStatus[user.id].listening=true
  
    try{
        const logger = await resolveDependency(Logger)
        const translation = await resolveDependency(Transcription)
        const tts = await resolveDependency(Tts)
        const client = translation.getClient()

        logger.log(`listen start ${user.username}`,"info")

        const receiver = connection.receiver;
        const opusStream=receiver.subscribe(user.id, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 1_000,
            },
        })
        const stream = client.transcriptionBiStreams()
        stream.on("error", (err) => {
          console.error(err)
        })
        .on("data", (response : transcribedText) => {
            console.log("from server",response.toObject())
            const text = response.getText()
            if(text){
                tts.speak(`${member.displayName}さんが${text}と言いました`)
            }
        })
        .on("end", () => {
          console.log("end write")
          receiver.subscriptions.delete(user.id)
          listeningStatus[user.id].listening=false
          logger.log(`listen end ${user.username}`,"info")
        })

        const opusDecoder=new prism.opus.Decoder({rate: 16000, channels: 1, frameSize: 960})
    
        const buffer=Buffer.alloc(16000 * 2 * 4) // 16KHz * 2bytes * 4secs
        let offset=0
        const flush=()=>{
            const audio = new VoiceAudio()
            
            console.log("send",user.id,offset)

            audio.setSpeakerId(user.id)
            audio.setAudio(buffer.subarray(0,offset))
            stream.write(audio)
            offset=0
        }
        opusStream.pipe(opusDecoder).on("error", (err) => {
            console.error(err)
            stream.end()
        }).on("data", (data : Buffer) => {
            //append to buffer
            data.copy(buffer,offset)
            offset+=data.length
            if(offset >= 16000 * 2 * 2){ // 2secs
                flush()
            }
        }).on("end", () => {
            flush()
            console.log("opus stream end")
            stream.end()
        })

        
        //const data = await streamToBuffer(opusStream.pipe(opusDecoder))
	} catch (error) {
		console.warn(error);
	}
}