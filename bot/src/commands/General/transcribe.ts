import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType, TextBasedChannel, Message, Guild, GuildMember } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { simpleSuccessEmbed,simpleErrorEmbed, resolveDependencies} from "@utils/functions"

import { Data, NgWord } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"
import { Tts } from "../../services/Tts"
import { Transcription } from "../../services/Transcription"
import { VoiceConnection } from "@discordjs/voice"
import { Readable } from "stream"


const COMBINED_LOG_DURATION = 5*60*1000 //5分

export interface TranscribedData{
    id: string,
    timestamp: number,
    member: GuildMember,
    text: string,
    written: Message | undefined,
}

@Discord()
export default class TranscribeCommand {

	@Slash({
		description: "会話を聞き取ります",
		name: 'transcribe'
	})
	@Guard(
		Disabled
	)
	async join(
		// @SlashOption({ name: 'channel', type: ApplicationCommandOptionType.Channel, 
		// 	channelTypes: [ChannelType.GuildText], required: true,
		// 	description: "聞き取り結果を書き出すところ"
		//  }) channel: VoiceChannel,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const voiceChat = await resolveDependency(VoiceChat)
		const transcription = await resolveDependency(Transcription)
		const tts = await resolveDependency(Tts)
		const dataRepository = db.get(Data)
		const ngword_db = db.get(NgWord)

		if(!voiceChat.isEnable()){
			simpleErrorEmbed(
				interaction,
				"まずはボイスチャンネルに呼んでください"
			)
			return
		}
		const targetChannel=interaction.channel
		const reaction_count : {[key: number]: number} = {}

		transcription.on("transcription",async (data: any)=>{
			const member = voiceChat.getChannel()?.guild.members.cache.get(data.speaker_id) as GuildMember		
			const ngwords=await ngword_db.getNgWords()
			const ngword_regex=new RegExp(`(${ngwords.join("|")})`)
			const ret=ngword_regex.exec(data.text)
			if(ret){
				const hit_word=ret[1]
				const [replys,ids]=await ngword_db.getReactions(hit_word)
				const reply_text=replys[Math.floor(Math.random()*replys.length)]
				tts.speak(reply_text as string)
				const transcribed : TranscribedData = {
					id: [data.packet_timestamp,data.speaker_id].join("_"),
					timestamp: data.begin,
					member,
					text: data.text + " <- " + reply_text,
					written: undefined
				}
				//const opusBuffer=Buffer.from(data.opusData)
				//tts.playQueue.push(Readable.from(opusBuffer))
				//tts.playNextInQueue()
	
				appendLog(transcribed)
				//ログの出力
				outputLog(targetChannel as TextBasedChannel)
			}
		})
		voiceChat.on("disconnect",async ()=>{
			clearLog()
		})

		await transcription.startListen(
			voiceChat.getConnection() as VoiceConnection,
			voiceChat.getChannel() as VoiceChannel,
			async ()=>{
				const ngwords=await ngword_db.getNgWords()
				return ngwords.join("、")
			})

		simpleSuccessEmbed(
			interaction,
			"NGワードの監視を開始します"
		)
		tts.speak("NGワードの監視を開始します")
	}
}



const transcribedLogs: Array<TranscribedData> = []
const transcribedLogsLimit = 100

function appendLog(log : TranscribedData){
	const index = transcribedLogs.findIndex((item) => item.id === log.id)
	if(index >= 0){
		const old = transcribedLogs[index]
		log.written = old.written
		transcribedLogs[index] = log
		console.log("update log",log.id)
		if(old.written){
			// 既に書き出されているので修正する
			const msg=old.written
			const logInMessage = transcribedLogs.filter(item=>item.written?.id === msg.id)
			msg.edit(createLogText(logInMessage)).then(()=>{
				console.log(`edit ${msg.id}`)
			})
		}
	}else{
		console.log("append log",log.id)
		transcribedLogs.push(log)
	}
	while(transcribedLogs.length > transcribedLogsLimit){
		transcribedLogs.shift()
	}
	console.log("log length",transcribedLogs.length)
}

function clearLog(){
	transcribedLogs.length = 0
}

let last_msg : Message<boolean> | null = null

async function outputLog(targetChannel?: TextBasedChannel){
	const logToBeSent=transcribedLogs.filter(item=>!item.written)
	const logToBeSentLength = logToBeSent.reduce((a,b)=>a+b.text.length,0)
	const now = Date.now()
	if(logToBeSent.length > 0){
		const last_msg_log=last_msg ? transcribedLogs.filter(item=>item.written?.id === last_msg?.id) : null
		if(last_msg && last_msg_log && last_msg_log.length < 10 && last_msg.content.length + logToBeSentLength < 2000){
				//前回のメッセージに追加する
				await last_msg.edit(createLogText(last_msg_log.concat(logToBeSent)))
		}else{
			// 新しいメッセージを作成する
			const msg=
				await targetChannel?.send(createLogText(logToBeSent)) as Message<boolean>
			if(msg){
				last_msg=msg
			}
		}
		if(last_msg){
			//送信済みをマーク
			logToBeSent.forEach(log=>{
				log.written=last_msg as Message<boolean>
			})
		}
	}
}

function createLogText(logs: Array<TranscribedData>) : string{
	const leftZeroPad = (num: number, length: number) => {
		return (Array(length).join('0') + num).slice(-length);
	}
	const timeStr=(time_msec: number)=>{
		const time = new Date(time_msec)

		return `${leftZeroPad(time.getHours(),2)}:${leftZeroPad(time.getMinutes(),2)}:${leftZeroPad(time.getSeconds(),2)}`
	}
	return logs.sort((a,b)=>a.timestamp-b.timestamp)
				.map(log=>`${timeStr(log.timestamp)} ${log.member.displayName} : ${log.text}`).join("\n")
}