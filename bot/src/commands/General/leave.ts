import { Category } from "@discordx/utilities"
import type { CommandInteraction, Message } from "discord.js"
import { Client } from "discordx"

import { Discord, Slash } from "@decorators"
import { leaveAll } from "../../utils/functions/voice_connection"
import { simpleSuccessEmbed } from "@utils/functions"


import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"

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
		await leaveAll()
		const db = await resolveDependency(Database)
		const dataRepository = db.get(Data)
		await dataRepository.set('lastVoiceChannel', null)

		simpleSuccessEmbed(
			interaction,
			`全て出ました`
		)
	}

}
