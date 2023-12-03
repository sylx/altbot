import { Category } from "@discordx/utilities"
import { ApplicationCommandOptionType, CommandInteraction, GuildMember, Message } from "discord.js"
import { Client, SlashChoice, SlashOption } from "discordx"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Discord, Slash } from "@decorators"
import { Tts } from "../../services/Tts"

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
		const tts=await resolveDependency(Tts)
		if(!count || count < 1) count=1
		if(count>10) count=10
		const repeat = async (text: string, count: number,initial_count: number) => {
			await tts.speak(text,{useCache: initial_count != 1, imediate: count == initial_count})
			if(count>1) await repeat(text, count-1,initial_count)
		}
		try {
			await simpleSuccessEmbed(
				interaction,
				`言います: ${text}`
			)
			await repeat(text, count, count)
			await simpleSuccessEmbed(
				interaction,
				`言いました ${count}回`
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
