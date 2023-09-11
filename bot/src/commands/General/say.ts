import { Category } from "@discordx/utilities"
import { ApplicationCommandOptionType, CommandInteraction, Message } from "discord.js"
import { Client, SlashOption } from "discordx"
import { simpleSuccessEmbed } from "@utils/functions"
import { Discord, Slash } from "@decorators"
import { sayText } from "../../utils/functions/voice_connection"

@Discord()
@Category('General')
export default class SayCommand {

	@Slash({ 
		name: 'say'
	})
	async say(
		@SlashOption({ name: 'text', type: ApplicationCommandOptionType.String, required: true,description: "なんか言わせたいこと" }) text: string,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		await sayText(text)
		
		simpleSuccessEmbed(
			interaction,
			`言いました: ${text}`
		)
	}

}
