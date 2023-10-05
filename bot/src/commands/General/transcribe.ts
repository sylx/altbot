import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType, TextBasedChannel, Message, Guild, GuildMember } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashGroup } from "@decorators"
import { Category } from "@discordx/utilities"
import { Disabled } from "@guards"
import { simpleSuccessEmbed,simpleErrorEmbed, resolveDependencies} from "@utils/functions"

import { Data, NgWord, NgWordHistory } from "@entities"
import { Database, Gpt,TranscribedData,VoiceLog } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"
import { Tts } from "../../services/Tts"
import { Transcription } from "../../services/Transcription"
import { VoiceConnection } from "@discordjs/voice"
import { botNames } from "@config"
import { injectable } from "tsyringe"


const COMBINED_LOG_DURATION = 5*60*1000 //5分

@Discord()
@injectable()
@Category('General')
@SlashGroup({ name: "transcribe",description: "聞き取り機能関連" })
@SlashGroup("transcribe")
export default class TranscribeCommand {

	@Slash({
		description: "会話の聞き取りを開始します",
		name: 'start'
	})
	@Guard(
		Disabled
	)
	async start(
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
		const voiceLog = await resolveDependency(VoiceLog)
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
		voiceLog.setChannel(targetChannel as TextBasedChannel)

		const dialogState : {[key: string]: Boolean} = {}

		const aizuchi = ["はい","うん","はいはい"]
		const doui = ["その通りです","わかります","そうですね"]
		const shazai=["すみません","ごめんなさい","申し訳ありません"]	
		await Promise.all([...doui,...aizuchi,...shazai].map((text)=>{
			return tts.speak(text,{useCache: true,silent: true})
		}))
		console.log("generated")

		transcription.on("transcription",async (data: any)=>{
			const member = voiceChat.getChannel()?.guild.members.cache.get(data.speaker_id) as GuildMember
			const member_me = voiceChat.getChannel()?.guild.members.cache.get(client.user?.id as Snowflake) as GuildMember
			console.log("member names",[
				member.displayName,
				member.nickname,
				member.user.username
			])

			if(data.speaker_id === interaction.user.id){
				let aiz = aizuchi[Math.floor(Math.random()*aizuchi.length)]
				if(data.text.match(/(?:ね|？|だろ)/)){
					aiz = doui[Math.floor(Math.random()*doui.length)]
				}
				if(data.text.match(/(?:君は|くれる|わかって|聞いて)/)){
					aiz = shazai[Math.floor(Math.random()*shazai.length)]
				}
				tts.speak(aiz,{useCache: true})
			}


			if(dialogState[data.speaker_id]){
				dialogState[data.speaker_id] = false

				const result = await gpt.makeRealtimeReaction(data.text)
				if(result === null) return
				const reply_text=result.reply_text.replace(/{username}/g,member.displayName)
				voiceLog.appendLog({
					id: [data.packet_timestamp,data.speaker_id].join("_"),
					timestamp: data.begin,
					member,
					text: data.text + " <- " + reply_text,
					written: undefined
				})
				await tts.speak(reply_text)

				const prize_point = Math.floor(Math.pow((result.hostile_score - 5),(result.hostile_score > 5 ? 2.5 : 2)) * (result.hostile_score > 5 ? 1 : -1))
				let prize_text = ""
				if(prize_point > 0){
					prize_text = `あなたのカルマは${prize_point}ポイント増加します。自業自得だね！`
				}else{
					prize_text = `あなたのカルマは${Math.abs(prize_point)}ポイント減少します。良かったね！`					
				}
				voiceLog.appendLog({
					id: [data.packet_timestamp,member_me.id].join("_"),
					timestamp: data.begin,
					member: member_me,
					text: prize_text,
					written: undefined
				})
				await ngword_history_db.addHistory(data.speaker_id,prize_point > 0 ? "😠" : "🤗",prize_point)
				tts.speak(prize_text)
				//ログの出力
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
				// const opusBuffer=Buffer.from(data.opusData)
				// tts.playQueue.push(Readable.from(opusBuffer))
				// tts.playNextInQueue()
	
				voiceLog.appendLog(transcribed)
				//ログの出力
			}
		})
		voiceChat.on("disconnect",async ()=>{
			voiceLog.clearLog()
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



