import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { simpleSuccessEmbed,simpleErrorEmbed} from "@utils/functions"

import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"
import { Tts } from "../../services/Tts"

@Discord()
export default class TranscribeCommand {

	@Slash({
		description: "会話を聞き取ります",
		name: 'transcribe'
	})
	@Guard(
		Disabled
	)
	async join(
		// @SlashOption({ name: 'channel', type: ApplicationCommandOptionType.Channel, 
		// 	channelTypes: [ChannelType.GuildText], required: true,
		// 	description: "聞き取り結果を書き出すところ"
		//  }) channel: VoiceChannel,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const db = await resolveDependency(Database)
		const voiceChat = await resolveDependency(VoiceChat)
		const tts = await resolveDependency(Tts)
		const dataRepository = db.get(Data)
		
		if(!voiceChat.isEnable()){
			simpleErrorEmbed(
				interaction,
				"まずはボイスチャンネルに呼んでください"
			)
			return
		}
		await voiceChat.startListen()
		simpleSuccessEmbed(
			interaction,
			"聞き取りを開始します"
		)
		tts.speak("聞き取りを開始します")
	}
}
