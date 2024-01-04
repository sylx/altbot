import { CommandInteraction, GuildMember, AttachmentBuilder, ApplicationCommandOptionType, VoiceChannel, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle } from "discord.js"
import { Client, SlashOption } from "discordx"

import { Discord, Guard, Slash, SlashGroup } from "@decorators"
import { Category } from "@discordx/utilities"
import { Disabled, GuildOnly } from "@guards"
import { resolveDependencyPerGuild, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"

import { resolveDependency } from "@utils/functions"
import { VoiceConnection } from "@discordjs/voice"
import { injectable } from "tsyringe"
import { KeywordSpotting,VoiceChat,Tts,Transcription, KeywordSpottingFoundEvent, TranscriptionEvent } from "@services"
import { EventEmitter } from "events"
import { KeywordSpottingEmbed, TranscriptionEmbed } from "@embeds"



@Discord()
@injectable()
@Category('General')
@SlashGroup({ name: "transcribe",description: "聞き取り機能関連" })
@SlashGroup("transcribe")
export default class TranscribeCommand {

	@Slash({
		description: "キーワード反応テスト",
		name: 'keyword'
	})
	@Guard(
		GuildOnly
	)
	async keyward(
		@SlashOption({ name: 'keyword', type: ApplicationCommandOptionType.String, required: true,description: "検出キーワード(空白区切りで複数可)" }) keyword: string,
		@SlashOption({ name: 'threshold', type: ApplicationCommandOptionType.Number, required: true,description: "検出しきい値(0.0-1.0)" }) threshold: number,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		if(interaction.guildId === null) return
		const voiceChat = await resolveDependencyPerGuild(VoiceChat, interaction.guildId)
		const tts= await resolveDependencyPerGuild(Tts, interaction.guildId)
		const keywordSpotting = await resolveDependencyPerGuild(KeywordSpotting, interaction.guildId)

		const member = interaction.member as GuildMember
		const current_channel = member.voice.channel as VoiceChannel

		if(!current_channel){
			simpleErrorEmbed(
				interaction,
				`ボイスチャンネルに入っていません`
			)
			return
		}
		await voiceChat.join(current_channel)
		const channel_members=Array.from(current_channel.members.values())

		const abortController = new AbortController()
		const emitter = new EventEmitter()
		const event_log : KeywordSpottingFoundEvent[]=[]
		
		emitter.on("ready",()=>{
			KeywordSpottingEmbed(interaction,keyword,event_log,abortController)
		})
		emitter.on("found",async (evt: KeywordSpottingFoundEvent)=>{
			
			event_log.push(evt)
			if(event_log.length > 5)
				event_log.shift()
			KeywordSpottingEmbed(interaction,keyword,event_log,abortController)			

			const words=[
				"うん。いいね",
				"綺麗な声だね",
				"いいじゃん！いいじゃん！",
				"おっけー",
				"いつもありがとう",
				"好きだよ"
			]
			const picked_word=words[Math.floor(Math.random() * words.length)]
			//const picked_word=evt.keyword
			await tts.speak(picked_word,undefined,{
				useCache: true
			})
		})
		try{
			await keywordSpotting.start(keyword.split(/[　\s]+/),threshold,channel_members,emitter,abortController)
			KeywordSpottingEmbed(interaction,keyword,event_log)
			simpleSuccessEmbed(
				interaction,
				`終了しました`
			)
		}catch(e: any){
			KeywordSpottingEmbed(interaction,keyword,event_log)
			simpleErrorEmbed(
				interaction,
				`エラーが発生したので終了します ${e}}`
			)
			console.error(e)
		}
		await voiceChat.leave()
	}

	@Slash({
		description: "聞き取りテスト",
		name: 'start'
	})
	@Guard(
		GuildOnly
	)
	async start(
		@SlashOption({ name: 'prompt', type: ApplicationCommandOptionType.String, required: true,description: "プロンプト（会話のジャンル的なもの)" }) prompt: string,		
		@SlashOption({ name: 'keyword', type: ApplicationCommandOptionType.String, required: false,description: "聞き取りやすくするキーワード(空白区切りで複数可)" }) keyword_string: string,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		if(interaction.guildId === null) return
		const voiceChat = await resolveDependencyPerGuild(VoiceChat, interaction.guildId)
		const tts= await resolveDependencyPerGuild(Tts, interaction.guildId)
		const transcription = await resolveDependencyPerGuild(Transcription, interaction.guildId)

		const member = interaction.member as GuildMember
		const current_channel = member.voice.channel as VoiceChannel

		if(!current_channel){
			simpleErrorEmbed(
				interaction,
				`ボイスチャンネルに入っていません`
			)
			return
		}
		await voiceChat.join(current_channel)
		const channel_members=Array.from(current_channel.members.values())

		const abortController = new AbortController()
		const emitter = new EventEmitter()
		const event_log : TranscriptionEvent[]=[]
		const keyword=keyword_string ? keyword_string.split(/\s　/) : []
		emitter.on("ready",()=>{
			TranscriptionEmbed(interaction,keyword,event_log,abortController)
		})
		emitter.on("transcription",async (evt: TranscriptionEvent)=>{
			
			event_log.push(evt)
			if(event_log.length > 5)
				event_log.shift()
			TranscriptionEmbed(interaction,keyword,event_log,abortController)			
		})
		try{
			await transcription.start(prompt,keyword,channel_members,emitter,abortController)
			TranscriptionEmbed(interaction,keyword,event_log)
			simpleSuccessEmbed(
				interaction,
				`終了しました`
			)
		}catch(e: any){
			TranscriptionEmbed(interaction,keyword,event_log)
			simpleErrorEmbed(
				interaction,
				`エラーが発生したので終了します ${e}}`
			)
			console.error(e)
		}
		await voiceChat.leave()
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



