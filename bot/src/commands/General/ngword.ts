import { Category } from "@discordx/utilities"
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, EmbedField,
	FetchMessageOptions,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js"
import { Client, SlashGroup } from "discordx"
import { injectable } from "tsyringe"

import { generalConfig } from "@config"
import { Discord, Slash,SlashOption } from "@decorators"
import { Guard } from "@guards"
import { Database, Stats } from "@services"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { NgWord } from "@entities"

const links = [
	{ label: 'Invite me!', url: generalConfig.links.invite },
	{ label: 'Support server', url: generalConfig.links.supportServer },
	{ label: 'Github', url: generalConfig.links.gitRemoteRepo }
]

@Discord()
@injectable()
@Category('General')
@SlashGroup({ name: "ngword",description: "NGワード関連" })
@SlashGroup("ngword")
export default class NgWordCommand {

	constructor(
		private stats: Stats
	) {}

	@Slash({
		name: 'add',
		description: 'NGワードを追加します'
	})
	@Guard()
	async add(
		@SlashOption({ name: '単語', type: ApplicationCommandOptionType.String,description: "NGワード",required: true }) ngword: string,
		@SlashOption({ name: '危険度', type: ApplicationCommandOptionType.String,description: "危険さ(1-10)",required: true }) score: number,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const ngword_db = db.get(NgWord)
		if(score < 1 || score > 10){
			simpleErrorEmbed(
				interaction,
				`危険度は1-10の間で指定してください`
			)
			return
		}

		try{
			const user_id=interaction.user.id
			const ngw=await ngword_db.addNgWord(ngword,score,interaction.guild?.members.cache.get(user_id))
			if(ngw instanceof NgWord){
				simpleSuccessEmbed(
					interaction,
					`追加しました: ${JSON.stringify({
						id: ngw.id,
						"危険度": ngw.score,
						"単語": ngw.words,
					},null,2)}`)
			}
		}catch(err){
			simpleErrorEmbed(
				interaction,
				`追加できませんでした ${ngword} ${err}`
			)
		}
	}
	@Slash({
		name: 'list',
		description: 'NGワードの一覧を表示します'
	})
	@Guard()
	async list(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const ngword_db = db.get(NgWord)
		const ngwords=await ngword_db.findAll()

		// 2000文字ごとに出力する
		let chunk : Array<string>=[]
		ngwords.sort((a,b)=>a.count-b.count).forEach(ngw=>{
			const member=interaction.guild?.members.cache.get(ngw.createdBy as string)
			const newline=`${ngw.id}: ${ngw.words.join(",")}  危険度:${ngw.score} 作成者:${member ? member.displayName : "**規制**"} 検知数:${ngw.count}回`
			if(chunk.reduce((a,b)=>a+b.length,0)+newline.length>2000){
				interaction.channel?.send(chunk.join("\n"))
				chunk=[]
			}
			chunk.push(newline)
		})
		interaction.channel?.send(chunk.join("\n"))
		simpleSuccessEmbed(
			interaction,
			`一覧を表示しました`
		)
	}
	@Slash({
		name: 'delete',
		description: 'NGワードを削除します'
	})
	@Guard()
	async delete(
		@SlashOption({ name: 'id', type: ApplicationCommandOptionType.Number,description: "NGワードID",required: true }) id: number,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const ngword_db = db.get(NgWord)
		const ngw=await ngword_db.findOne({id})
		if(ngw){
			await ngword_db.getEntityManager().remove(ngw).flush()
			simpleSuccessEmbed(
				interaction,
				`削除しました ${ngw.id} ${ngw.words}`
			)
			return
		}
		simpleErrorEmbed(
			interaction,
			`削除できませんでした ${id}`
		)
	}
	@Slash({
		name: 'start',
		description: 'NGワードの監視を開始します'
	})
	@Guard()
	async start(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
	}
}