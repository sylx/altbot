import { CommandInteraction, VoiceChannel, Snowflake, TextBasedChannel, GuildMember, AttachmentBuilder, User } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashGroup } from "@decorators"
import { Category } from "@discordx/utilities"
import { Disabled } from "@guards"
import { simpleSuccessEmbed, simpleErrorEmbed } from "@utils/functions"

import { NgWord, NgWordHistory } from "@entities"
import { Database, Gpt, TranscribedData, VoiceLog } from "@services"
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

		let listenTo : User | null = null
		let listenText : Array<any> = []
		let listenToTimeout : NodeJS.Timeout | null = null

		interaction.reply({
			content: "準備中..."
		})

		const aizuchi = ["はい","あー","んー","ほい","あっ","うーん"]
		const doui = ["その通りです","わかります","そうですね","はい、聞いてます"]
		const sokushin = ["聞いてます","はい","はい、聞いてます","はい、聞いてますよ","大丈夫です、続けて"]
		const shazai=["すみません","誠にごめんなさい","ごめんなさい","申し訳ありません","すみませんでした"]

		//キャッシュ生成
		const funcs=[...doui,...aizuchi,...shazai,...sokushin].map((text)=>{
			return ()=>tts.speak(text,null,{useCache: true,silent: true})
		}) as Array<()=>Promise<void>>
		for(let f of funcs){
			await f()
		}

		transcription.on("vad",async (data: any)=>{
			console.log("received vad",{
				id: data.id
			})
			if(data.speaker_id === listenTo?.id){
				let aiz = aizuchi[Math.floor(Math.random()*aizuchi.length)]
				tts.speak(aiz,null,{useCache: true})
			}
		})

		transcription.on("transcription",async (data: any)=>{
			console.log("received",{
				ids: data.ids,
				speaker_id:data.speaker_id,
				text: data.text,
				temperature: data.temperature,
				compression_ratio: data.compression_ratio
			})
			if(data.text.match(/(?:視聴ありがとうございました|編曲)/)) return
			const member = voiceChat.getChannel()?.guild.members.cache.get(data.speaker_id) as GuildMember
			const member_me = voiceChat.getChannel()?.guild.members.cache.get(client.user?.id as Snowflake) as GuildMember

			if(data.speaker_id === listenTo?.id){
				if(listenToTimeout){
					clearTimeout(listenToTimeout)
				}

				let aiz = null
				if(data.text.match(/(?:よね|？|だろ)/)){
					aiz = doui[Math.floor(Math.random()*doui.length)]
				}
				if(data.text.match(/(?:え？|違う|聞)/)){
					aiz = sokushin[Math.floor(Math.random()*sokushin.length)]
				}
				if(data.text.match(/(?:お前|あなた|君|考え|くれる|わかって|のか|だろ|がよ|わかる)/)){
					aiz = shazai[Math.floor(Math.random()*shazai.length)]
				}
				if(aiz){
					tts.speak(aiz,null,{useCache: true,imediate: true})
				}
				const toUpdateIndex = listenText.findIndex(item=>item.packet_timestamp === data.packet_timestamp)
				if(toUpdateIndex > -1){
					listenText[toUpdateIndex] = data
				}else{
					listenText.push(data)
				}
				const reply=async ()=>{
					if(listenText.length > 0){
						listenTo=null
						const question = listenText.map(data=>data.text).join("、")
						listenText=[]
						tts.speak("うーんちょっと待って。整理するね。どうなんだろね。それは",null,{useCache: true,imediate: true})
						voiceLog.appendLog({
							id: [Date.now(),data.speaker_id].join("_"),
							timestamp: data.begin,
							member,
							text: question,
							written: undefined
						})
						const result = await gpt.makeRealtimeReaction(question)
						if(result === null) return
						const reply_text=result.reply_text.replace(/{username}/g,member.displayName)
						voiceLog.appendLog({
							id: [Date.now(),member_me.id].join("_"),
							timestamp: data.begin,
							member: member_me,
							text: reply_text,
							written: undefined
						})
						await tts.speak(reply_text,null,{imediate: true})

						const prize_point = Math.floor(Math.pow((result.hostile_score - 5),(result.hostile_score > 5 ? 2.5 : 2)) * (result.hostile_score > 5 ? 1 : -1))
						let prize_text = ""
						if(prize_point > 0){
							prize_text = `あなたのカルマは${prize_point}ポイント増加します。自業自得だね！`
						}else{
							prize_text = `あなたのカルマは${Math.abs(prize_point)}ポイント減少します。良かったね！`					
						}
						voiceLog.appendLog({
							id: [Date.now(),member_me.id].join("_"),
							timestamp: data.begin,
							member: member_me,
							text: prize_text,
							written: undefined
						})
						await ngword_history_db.addHistory(data.speaker_id,prize_point > 0 ? "😠" : "🤗",prize_point)
						await tts.speak(prize_text)
						interaction.editReply({
							content: "聞き取り中..."
						})
					}
				}
				listenToTimeout=setTimeout(reply,5000)
				return
			}

			const botNamesRegex = new RegExp(`(${botNames.join("|")})`)
			if(botNamesRegex.test(data.text)){
				await tts.speak(`${member.displayName}、何ですか？ゆっくり話してください`)
				listenTo = member.user
				interaction.editReply({
					content: `${member.displayName}のお言葉を傾聴しています`
				})
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
			}) // prompt

		interaction.editReply({
			content: "聞き取りを開始しました"
		})
		tts.speak("聞き取りを開始しました")
	}

	@Slash({
		description: "音声パケットリストを出力します（デバッグ用)",
		name: 'dump'
	})
	@Guard(
		Disabled
	)
	async dump(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	){
		const voiceChat = await resolveDependency(VoiceChat)
		const transcription = await resolveDependency(Transcription)

		const buffer=await transcription.getPacketDump(
			voiceChat.getConnection() as VoiceConnection,
			interaction.member as GuildMember
		)
		console.log("dump",buffer.length,buffer.subarray(0,10))
		const attachment = new AttachmentBuilder(buffer)
		attachment.setName(`dump-${interaction.user.username}-${Date.now()}.bin`)		
		interaction.followUp({
			files: [attachment],
			content: "ダンプしました"
		})
	}

}



