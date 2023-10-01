import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType, TextBasedChannel, Message, Guild, GuildMember } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { simpleSuccessEmbed,simpleErrorEmbed, resolveDependencies} from "@utils/functions"

import { Data, NgWord, NgWordHistory } from "@entities"
import { Database, Gpt } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"
import { Tts } from "../../services/Tts"
import { Transcription } from "../../services/Transcription"
import { VoiceConnection } from "@discordjs/voice"
import { Readable } from "stream"
import { botNames } from "@config"


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
		const ngword_history_db = db.get(NgWordHistory)
		const gpt = await resolveDependency(Gpt)

		if(!voiceChat.isEnable()){
			simpleErrorEmbed(
				interaction,
				"まずはボイスチャンネルに呼んでください"
			)
			return
		}
		const targetChannel=interaction.channel
		const dialogState : {[key: string]: Boolean} = {}

		transcription.on("transcription",async (data: any)=>{
			const member = voiceChat.getChannel()?.guild.members.cache.get(data.speaker_id) as GuildMember
			const member_me = voiceChat.getChannel()?.guild.members.cache.get(client.user?.id as Snowflake) as GuildMember
			console.log("member names",[
				member.displayName,
				member.nickname,
				member.user.username
			])

			if(dialogState[data.speaker_id]){
				dialogState[data.speaker_id] = false

				const result = await gpt.makeRealtimeReaction(data.text)
				if(result === null) return
				const reply_text=result.reply_text.replace(/{username}/g,member.displayName)
				appendLog({
					id: [data.packet_timestamp,data.speaker_id].join("_"),
					timestamp: data.begin,
					member,
					text: data.text + " <- " + reply_text,
					written: undefined
				})
				outputLog(targetChannel as TextBasedChannel)
				await tts.speak(reply_text)

				const prize_point = Math.floor(Math.pow((result.hostile_score - 5),(result.hostile_score > 5 ? 2.5 : 2)) * (result.hostile_score > 5 ? 1 : -1))
				let prize_text = ""
				if(prize_point > 0){
					prize_text = `あなたの総スコアは${prize_point}ポイント増加します。自業自得だね！`
				}else{
					prize_text = `あなたの総スコアは${Math.abs(prize_point)}ポイント減少します。良かったね！`					
				}
				appendLog({
					id: [data.packet_timestamp,member_me.id].join("_"),
					timestamp: data.begin,
					member: member_me,
					text: prize_text,
					written: undefined
				})
				await ngword_history_db.addHistory(data.speaker_id,prize_point > 0 ? "😠" : "🤗",prize_point)
				tts.speak(prize_text)
				//ログの出力
				outputLog(targetChannel as TextBasedChannel)
				return
			}

			const botNamesRegex = new RegExp(`(${botNames.join("|")})`)
			if(botNamesRegex.test(data.text)){
				await tts.speak(`${member.displayName}、何ですか？ゆっくり話してください`)
				dialogState[data.speaker_id] = true
				return
			}

			const ngwords=await ngword_db.getNgWords()
			const ngword_regex=new RegExp(`(${ngwords.join("|")})`)
			const ret=ngword_regex.exec(data.text)
			if(ret){
				const hit_word=ret[1]
				const ngw=await ngword_db.getReactions(hit_word)
				if(ngw === null) return
				ngw.count++
				await ngword_db.getEntityManager().persistAndFlush(ngw)
				await ngword_history_db.addHistory(data.speaker_id,hit_word,ngw.score)
				const stat=await ngword_history_db.getStatisticsByMember(data.speaker_id)
				console.log(stat)

				let reactions = ngw.gentle_reactions
				if(stat.total_score > 0){
					reactions = ngw.normal_reactions
				}else if(stat.total_score > 100){
					reactions = ngw.guilty_reactions
				}
				const reply_text=reactions[Math.floor(Math.random()*reactions.length)].replace(/{username}/g,member.displayName)
				tts.speak(reply_text)
				const transcribed : TranscribedData = {
					id: [data.packet_timestamp,data.speaker_id].join("_"),
					timestamp: data.begin,
					member,
					text: data.text + " <- " + reply_text,
					written: undefined
				}
				const opusBuffer=Buffer.from(data.opusData)
				tts.playQueue.push(Readable.from(opusBuffer))
				tts.playNextInQueue()
	
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
				return [...ngwords,...botNames,"ご視聴ありがとうございました"].join("、")
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