import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { simpleSuccessEmbed } from "@utils/functions"
import { joinVoiceChannel } from "@discordjs/voice"
import { leaveAll, registerConnections } from "../../utils/functions/voice_connection"
import { createDiscordJSAdapter } from "../../utils/functions/adapter"

import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"

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
		const dataRepository = db.get(Data)

		const conn = joinVoiceChannel({
			adapterCreator: channel.guild.voiceAdapterCreator,
			channelId: channel.id,
			guildId: channel.guild.id,
			debug: true
		})
		await registerConnections(conn,client)
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
	const dataRepository = db.get(Data)
	const channId = await dataRepository.get('lastVoiceChannel')

	if (channId) {
		await leaveAll()
		const guild = client.guilds.cache.get(channId.guildId)
		if(guild){
			const conn = joinVoiceChannel({
				adapterCreator: guild.voiceAdapterCreator,
				channelId: channId.channelId,
				guildId: channId.guildId,
				debug: true
			})
			await registerConnections(conn,client)		
		}
	}
	
}
