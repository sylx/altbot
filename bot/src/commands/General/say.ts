import { Category } from "@discordx/utilities"
import { ApplicationCommandOptionType, CommandInteraction, GuildMember, Message, VoiceChannel } from "discord.js"
import { Client, SlashChoice, SlashOption } from "discordx"
import { resolveDependency, resolveDependencyPerGuild, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Discord, Slash } from "@decorators"
import { Tts } from "../../services/Tts"
import { VoiceChat } from "@services"

@Discord()
@Category('General')
export default class SayCommand {

	@Slash({ 
		description: "喋ります ver2",
		name: 'say'
	})
	async say(
		@SlashOption({ name: 'text', type: ApplicationCommandOptionType.String, required: true,description: "なんか言わせたいこと" }) text: string,
		@SlashOption({ name: 'count', type: ApplicationCommandOptionType.Integer, required: false,description: "何回言わせるか(1-10)" }) count: number,
		@SlashOption({ name: '名前呼びチェック', type: ApplicationCommandOptionType.Mentionable,description: "対象者の名前を呼ぶ",required: false }) target_member: GuildMember,
		@SlashOption({ name: 'speaker_id', type: ApplicationCommandOptionType.Integer,description: "SpeakerId",required: false }) speaker_id: number,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		if(target_member){
			await simpleSuccessEmbed(
				interaction,
				JSON.stringify({
					GuildMember: {
						id: target_member.id,
						nickname: target_member.nickname,
						displayName: target_member.displayName,
					},
					User: {
						id: target_member.user.id,
						username: target_member.user.username,
						tag: target_member.user.tag,
						globalname: target_member.user.globalName
					}
				},null,2)
			)
			return
		}
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
		

		if(!count || count < 1) count=1
		if(count>10) count=10
		const repeat = async (text: string, count: number,initial_count: number) => {
			await tts.speak(text,speaker_id,{useCache: initial_count != 1, imediate: count == initial_count})
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
