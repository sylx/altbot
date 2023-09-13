import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { simpleSuccessEmbed } from "@utils/functions"

import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"

@Discord()
export default class JoinCommand {

	@Slash({
		name: 'join'
	})
	@Guard(
		Disabled
	)
	async join(
		@SlashOption({ name: 'channel', type: ApplicationCommandOptionType.Channel, required: true }) channel: VoiceChannel,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const voiceChat = await resolveDependency(VoiceChat)
		const dataRepository = db.get(Data)

		await voiceChat.join(channel)

		await dataRepository.set('lastVoiceChannel', {
			channelId: channel.id,
			guildId: channel.guild.id
		})

		simpleSuccessEmbed(
			interaction,
			`入りました: ${channel.name}`
		)
	}
}

export async function joinLastChannel(client : Client) {
	const db = await resolveDependency(Database)
	const voiceChat = await resolveDependency(VoiceChat)
	const dataRepository = db.get(Data)
	const channId = await dataRepository.get('lastVoiceChannel')

	if (channId) {
		await voiceChat.leave()
		const guild = client.guilds.cache.get(channId.guildId)
		if(guild){
			await voiceChat.join(guild.channels.cache.get(channId.channelId) as VoiceChannel)
		}
	}
	
}
