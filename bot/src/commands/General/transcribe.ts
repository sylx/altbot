import { CommandInteraction, GuildMember, AttachmentBuilder, ApplicationCommandOptionType, VoiceChannel, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle } from "discord.js"
import { Client, SlashOption } from "discordx"

import { Discord, Guard, Slash, SlashGroup } from "@decorators"
import { Category } from "@discordx/utilities"
import { Disabled, GuildOnly } from "@guards"
import { resolveDependencyPerGuild, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"

import { resolveDependency } from "@utils/functions"
import { VoiceConnection } from "@discordjs/voice"
import { injectable } from "tsyringe"
import { KeywordSpotting,VoiceChat,Tts,Transcription, KeywordSpottingFoundEvent } from "@services"
import { EventEmitter } from "events"


const COMBINED_LOG_DURATION = 5*60*1000 //5分

@Discord()
@injectable()
@Category('General')
@SlashGroup({ name: "transcribe",description: "聞き取り機能関連" })
@SlashGroup("transcribe")
export default class TranscribeCommand {

	@Slash({
		description: "会話の聞き取りを開始します（キーワード反応テスト中)",
		name: 'start'
	})
	@Guard(
		GuildOnly
	)
	async start(
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
			this.updateEmbed(interaction,keyword,event_log,abortController)
		})
		emitter.on("found",async (evt: KeywordSpottingFoundEvent)=>{
			
			event_log.push(evt)
			if(event_log.length > 5)
				event_log.shift()
			this.updateEmbed(interaction,keyword,event_log,abortController)			

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
			this.updateEmbed(interaction,keyword,event_log,null)
			simpleSuccessEmbed(
				interaction,
				`終了しました`
			)
		}catch(e: any){
			this.updateEmbed(interaction,keyword,event_log,null)
			simpleErrorEmbed(
				interaction,
				`エラーが発生したので終了します ${e}}`
			)
			console.error(e)
		}
		await voiceChat.leave()
	}

    async updateEmbed(interaction: CommandInteraction,keyword: string,event_log: KeywordSpottingFoundEvent[],abortController: AbortController | null){
        const embed = new EmbedBuilder()
            .setColor(0x00ffff)
            .setTitle("キーワード検出結果")
            .setDescription(`設定キーワード:${keyword}`)
            .setFields(event_log.map(item=>{
					const displayName=item.speaker_id ? interaction.guild?.members.cache.get(item.speaker_id)?.displayName : "不明"
                    return {
                        name: `${item.keyword} (${new Date(item.timestamp).toLocaleTimeString('ja-JP', { hour12: false })})`,
                        value: `確度: ${item.probability} 発言者: ${displayName}`,
                        inline: false
                    }
                }))
        const buttons = [
            new ButtonBuilder()
                .setLabel('停止')
                .setStyle(ButtonStyle.Danger)
                .setCustomId('stop')
        ]
        const row=new ActionRowBuilder<ButtonBuilder>()
            .addComponents(...buttons)
        const msg = await interaction.editReply({
            embeds: [embed],
            components: abortController ? [row] : []
        })

		if(abortController){
			const collector=msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 })
			collector.on('collect', async i => {
				if(i.customId === "stop"){
					abortController.abort()
				}
			})
		}
        return msg
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



