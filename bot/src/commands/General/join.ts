import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { resolveDependencyPerGuild, simpleSuccessEmbed } from "@utils/functions"

import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"
import { Tts } from "../../services/Tts"

@Discord()
export default class JoinCommand {

	@Slash({
		description: "ボイスチャンネルに入ります",
		name: 'join'
	})
	@Guard(
		Disabled
	)
	async join(
		@SlashOption({ name: 'channel', type: ApplicationCommandOptionType.Channel, channelTypes: [ChannelType.GuildVoice], required: true }) channel: VoiceChannel,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		if(interaction.guildId === null) return
		const db = await resolveDependency(Database)
		const voiceChat = await resolveDependencyPerGuild(VoiceChat, interaction.guildId)
		const tts = voiceChat.getTts()
		const dataRepository = db.get(Data)

		await voiceChat.join(channel)

		await dataRepository.set('lastVoiceChannel', {
			channelId: channel.id,
			guildId: channel.guild.id
		})

		await tts.speak("こんにちは")
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
		const guild = client.guilds.cache.get(channId.guildId)
		if(guild){
			const voiceChat = await resolveDependencyPerGuild(VoiceChat, guild.id)
			await voiceChat.join(guild.channels.cache.get(channId.channelId) as VoiceChannel)
			await voiceChat.getTts().speak("ただいま")
		}
	}
	
}
