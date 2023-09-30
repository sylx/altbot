import { Category } from "@discordx/utilities"
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, EmbedField,
	FetchMessageOptions,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js"
import { Client, SlashGroup } from "discordx"
import { injectable } from "tsyringe"

import { generalConfig } from "@config"
import { Discord, Slash,SlashOption } from "@decorators"
import { Guard } from "@guards"
import { Database, Stats,Gpt } from "@services"
import { getColor, resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
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
		@SlashOption({ name: '単語', type: ApplicationCommandOptionType.String,description: "NGワード",required: true }) ngword: String,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const ngword_db = db.get(NgWord)
		const gpt = await resolveDependency(Gpt)

		try{
			const result=await gpt.makeNgWord(ngword)
			if(result){
				console.log(JSON.stringify(result,null,2))
				const ngw=await ngword_db.addNgWord(
					[ngword,...result.synonyms],
					result.responses
				)
				simpleSuccessEmbed(
					interaction,
					`追加しました: ${JSON.stringify({
						id: ngw.id,
						words: ngw.words,
						reactions: ngw.reactions.length
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
		ngwords.forEach(ngw=>{
			const w=ngw.words
			const id=ngw.id
			const newline=`${id}: ${w}`
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

}