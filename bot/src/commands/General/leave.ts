import { Category } from "@discordx/utilities"
import type { CommandInteraction, Message } from "discord.js"
import { Client } from "discordx"

import { Discord, Slash } from "@decorators"
import { simpleSuccessEmbed } from "@utils/functions"


import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"

@Discord()
@Category('General')
export default class LeaveCommand {

	@Slash({ 
		name: 'leave'
	})
	async leave(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const voiceChat = await resolveDependency(VoiceChat)
		const dataRepository = db.get(Data)
		await dataRepository.set('lastVoiceChannel', null)
		await voiceChat.leave()

		simpleSuccessEmbed(
			interaction,
			`全て出ました`
		)
	}

}
