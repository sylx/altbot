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
		@SlashOption({ name: 'count', type: ApplicationCommandOptionType.Integer, required: false,description: "何回言わせるか(1-10)" }) count: number,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const tts=await resolveDependency(Tts)
		if(!count || count < 1) count=1
		if(count>10) count=10
		const repeat = async (text: string, count: number,initial_count: number) => {
			await tts.speak(text,{useCache: initial_count != 1})
			if(count>1) await repeat(text, count-1,initial_count)
		}
		try {
			await simpleSuccessEmbed(
				interaction,
				`言います: ${text}`
			)
			await repeat(text, count, count)
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
