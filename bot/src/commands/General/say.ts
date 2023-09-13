import { Category } from "@discordx/utilities"
import { ApplicationCommandOptionType, CommandInteraction, Message } from "discord.js"
import { Client, SlashChoice, SlashOption } from "discordx"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Discord, Slash } from "@decorators"
import { Tts } from "../../services/Tts"

@Discord()
@Category('General')
export default class SayCommand {

	@Slash({ 
		description: "喋ります",
		name: 'say'
	})
	async say(
		@SlashOption({ name: 'text', type: ApplicationCommandOptionType.String, required: true,description: "なんか言わせたいこと" }) text: string,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const tts=await resolveDependency(Tts)
		try {
			await tts.speak(text)
			simpleSuccessEmbed(
				interaction,
				`言いました: ${text}`
			)
		}catch( err: any ){
			if(err == "yet join voice channel"){
				simpleErrorEmbed(
					interaction,
					`まずはボイスチャンネルに呼んでください /join`
				)
			}else{
				simpleErrorEmbed(
					interaction,
					err
				)
				console.error(err)
			}
		}
	}

}
