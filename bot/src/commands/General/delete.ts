import { Category } from "@discordx/utilities"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, EmbedField,
	FetchMessageOptions,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js"
import { Client } from "discordx"
import { injectable } from "tsyringe"
dayjs.extend(relativeTime)

import { generalConfig } from "@config"
import { Discord, Slash,SlashOption } from "@decorators"
import { Guard, UserPermissions } from "@guards"
import { Stats } from "@services"
import { getColor, isValidUrl, simpleErrorEmbed, timeAgo } from "@utils/functions"

import packageJSON from "../../../package.json"
import { resolveDependency } from "@utils/functions"
import { Tts } from "../../services/Tts"

const links = [
	{ label: 'Invite me!', url: generalConfig.links.invite },
	{ label: 'Support server', url: generalConfig.links.supportServer },
	{ label: 'Github', url: generalConfig.links.gitRemoteRepo }
]

@Discord()
@injectable()
@Category('General')
export default class DeleteCommand {

	constructor(
		private stats: Stats
	) {}

	@Slash({
		name: 'delete',
		description: 'Botの発言を消します'
	})
	@Guard(
		UserPermissions(['Administrator'])
	)
	async delete(
		@SlashOption({ name: 'msg_id', type: ApplicationCommandOptionType.String,description: "消したいメッセージID",required: true }) msg_id: String,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const messages=interaction.channel?.messages
		if(messages){
			const target=await interaction.channel?.messages.fetch({
				message: msg_id
			} as FetchMessageOptions)
			if(target && target.deletable && target.author.id==client.user?.id){
				await target.delete()
			}else{
				simpleErrorEmbed(
					interaction,
					`メッセージが見つからないか、削除できませんでした ${msg_id}`
				)
			}
		}else{
			console.log("can't fetch message in channel",interaction.channel?.id,interaction.channel?.messages.cache.size)
		}
		interaction.deleteReply()
	}
}