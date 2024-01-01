import { Category } from "@discordx/utilities"
import { ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction, GuildMember, Message, VoiceChannel } from "discord.js"
import { Client, SlashChoice, SlashOption } from "discordx"
import { resolveDependency, resolveDependencyPerGuild, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Discord, Slash } from "@decorators"
import { Tts } from "../../services/Tts"
import { VoiceChat } from "@services"

@Discord()
@Category('General')
export default class SayCommand {

	@Slash({ 
		description: "喋ります ver3",
		name: 'say'
	})
	async say(
		@SlashOption({ name: 'text', type: ApplicationCommandOptionType.String, required: true,description: "なんか言わせたいこと" }) text: string,
		@SlashOption({ name: 'speaker_id', type: ApplicationCommandOptionType.Integer,description: "SpeakerId",required: false }) speaker_id: number,
		@SlashOption({ name: 'style', type: ApplicationCommandOptionType.String,description: "感情",required: false,
		autocomplete: function (
			interaction: AutocompleteInteraction
		  ) {
			  interaction.respond([
				// 'Neutral', 'Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise'
				{ name: "普通", value: "Neutral" },
				{ name: "怒り", value: "Angry" },
				{ name: "嫌悪", value: "Disgust" },
				{ name: "恐怖", value: "Fear" },
				{ name: "喜び", value: "Happy" },
				{ name: "悲しみ", value: "Sad" }
			  ]);
		  }		
	 }) style: string,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		if(interaction.guildId === null) return
		const voiceChat = await resolveDependencyPerGuild(VoiceChat, interaction.guildId)
		const tts= await resolveDependencyPerGuild(Tts, interaction.guildId)
		const list = await tts.getSpeakersInfo()
		if(speaker_id && list.getSpeakersList().map(s=>s.getIndex()).includes(speaker_id) == false){
			simpleErrorEmbed(
				interaction,
				`SpeakerIdが不正です`
			)
			return
		}
		const member = interaction.member as GuildMember
		const current_channel = member.voice.channel as VoiceChannel


		if(!current_channel){
			simpleErrorEmbed(
				interaction,
				`ボイスチャンネルに入っていません`
			)
			return
		}
		await voiceChat.join(current_channel)
		

		const count = 1
		const repeat = async (text: string, count: number,initial_count: number) => {
			await tts.speak(text,speaker_id,{useCache: initial_count != 1, imediate: count == initial_count, 
				extra: {
					style
				}})
			if(count>1) await repeat(text, count-1,initial_count)
		}
		await simpleSuccessEmbed(
			interaction,
			`言います: ${text}`
		)
		await repeat(text, count, count)
		await voiceChat.leave()
	}

}
