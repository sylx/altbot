import { GuildMember, User } from "discord.js"
import { VoiceConnection,EndBehaviorType } from "@discordjs/voice";
import { transcribedText } from "../../../grpc/transcription_pb"
import { Logger } from "@services"
import { resolveDependency } from "@utils/functions"
import { Transcription,TranscriptionWriteStream } from "../../services/Transcription";
import { VoiceChat } from "../../services/VoiceChat";

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
        const transcription = await resolveDependency(Transcription)
        const voiceChat = await resolveDependency(VoiceChat)
        const client = transcription.getClient()

        logger.log(`listen start ${user.username}`,"info")

        const api_stream = client.transcriptionBiStreams()
        const api_promise = new Promise((resolve,reject)=>{
            api_stream.on("error", (err) => {
            console.error(err)
            })
            .on("data", (response : transcribedText) => {
                console.log("from server",response.toObject())
                const text = response.getText()
                console.log(`${member.displayName} : ${text}`)
            })
            .on("end", () => {
                console.log("api read end")
                resolve()
            })
        }) as Promise<void>

        const receiver = connection.receiver;
        const opusStream=receiver.subscribe(user.id, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 500,
            },
        })
        const output = new TranscriptionWriteStream(api_stream,user.id)

        const output_promsie = new Promise((resolve,reject)=>{
            opusStream
                .pipe(output)
                .on("finish",async ()=>{
                    console.log("write end")
                    listeningStatus[user.id].listening=false
                    resolve()
                })
        }) as Promise<void>
        await Promise.all([api_promise,output_promsie])
	} catch (error) {
		console.warn(error);
	}
}