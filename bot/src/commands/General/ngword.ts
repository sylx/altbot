import { Category } from "@discordx/utilities"
import { APIEmbedField, ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, EmbedField,
	FetchMessageOptions,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js"
import { Client, SlashGroup } from "discordx"
import { injectable } from "tsyringe"

import { generalConfig } from "@config"
import { Discord, Slash,SlashOption } from "@decorators"
import { Guard } from "@guards"
import { Database, Stats } from "@services"
import { getColor, resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { NgWord, NgWordHistory } from "@entities"

import { table as TextTable,getBorderCharacters } from 'table';
import { ResponseFiltersContainer } from "@tsed/common"
import { I } from "ts-toolbelt"


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
		@SlashOption({ name: '類義語生成をしない', type: ApplicationCommandOptionType.Boolean,description: "類義語を生成しない場合はTrue",required: false }) without_synonym: boolean,
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
			const ngw=await ngword_db.addNgWord(ngword,score,interaction.guild?.members.cache.get(user_id),Boolean(without_synonym))
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
		let chunk : Array<Array<string>>=[]
		const tablize=(chunk : Array<Array<string>>) : string => {
			const header = [
				"ID",
				"単語",
				"危険度",
				"作成者",
				"検知数"
			]
			return "```"+TextTable(
				[header,...chunk],
				{
					border : getBorderCharacters('norc'),
					columns: [
						{ alignment: 'left' },
						{ alignment: 'left' },
						{ alignment: 'right' },
						{ alignment: 'center' },
						{ alignment: 'right' }						
					],
					drawVerticalLine: ()=>false,
				}
				// whitespace * 2 => U+2001
			).replace(/  /g,"\u3000")+"```"
		}
		ngwords.sort((a,b)=>b.count-a.count).forEach(ngw=>{
			const member=interaction.guild?.members.cache.get(ngw.createdBy as string)
			const newline=[
				ngw.id,
				ngw.words.join("、"),
				ngw.score,
				member ? member.displayName : "**規制**",
				ngw.count
			] as Array<string>

			const table=tablize([...chunk,newline])

			if(table.length>2000){
				interaction.channel?.send(tablize(chunk))
				chunk=[]
			}
			chunk.push(newline)
		})
		interaction.channel?.send(tablize(chunk))
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
		name: 'ranking',
		description: '要注意人物のランキングを表示します'
	})
	@Guard()
	async start(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const ngword_history_db = db.get(NgWordHistory)
		const stats=await ngword_history_db.getStatistics()
		const embed_promise=stats.sort((a,b)=>b.total_score-a.total_score).map( async (stat,index)=>{
			const member=interaction.guild?.members.cache.get(stat.member_id)
			let embed : EmbedBuilder | null = null
			if(member){
				const medals=["👑","🥈","🥉","🏅","🏅","🏅","🏅"]
				const medal = medals[index] || ""
				embed = new EmbedBuilder()
				embed
					.setTitle(`${medal}第${index+1}位${medal} ${member.displayName}(${member.user.username})`)
					.setThumbnail(member.user.displayAvatarURL())
				embed
					.setColor(getColor('primary'))
					.addFields([
					{
						name: "総スコア",
						value: stat.total_score.toString(),
						inline: true,
					} as APIEmbedField,
					{
						name: "総検知数",
						value: stat.total_count.toString(),
						inline: true,
					} as EmbedField,
				])
				if(index < 3){
					const hit_words=await ngword_history_db.getRecentHistory(stat.member_id,5)
					embed.setFooter({
						text: `最近の発言: ${hit_words.map(h=>h.hit_word).join("、")}`
					})
				}
			}
			return embed
		})
		const embeds = await Promise.all(embed_promise)
		const filtered_embeds = embeds.filter(Boolean) as EmbedBuilder[]
		if(filtered_embeds.length > 0){
			await interaction.followUp({
				embeds: filtered_embeds
			})
		}else{
			simpleSuccessEmbed(
				interaction,
				`全員いい子です`
			)
		}
	}
}