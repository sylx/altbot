import { Category } from "@discordx/utilities"
import { ApplicationCommandOptionType, CommandInteraction, Message } from "discord.js"
import { Client, SlashOption } from "discordx"
import { resolveDependency, simpleSuccessEmbed } from "@utils/functions"
import { Discord, Slash } from "@decorators"
import { Tts } from "../../services/Tts"

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
		const tts=await resolveDependency(Tts)
		await tts.speak(text)
		simpleSuccessEmbed(
			interaction,
			`言いました: ${text}`
		)
	}

}
