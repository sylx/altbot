import { Category } from "@discordx/utilities"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, EmbedBuilder, EmbedField,
	GuildMember,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder, VoiceChannel } from "discord.js"
import { Client } from "discordx"
import { injectable } from "tsyringe"
dayjs.extend(relativeTime)

import { generalConfig } from "@config"
import { Discord, Slash } from "@decorators"
import { Guard } from "@guards"
import { Stats, VoiceChat } from "@services"
import { getColor, isValidUrl, timeAgo } from "@utils/functions"

import packageJSON from "../../../package.json"
import { resolveDependency } from "@utils/functions"
import { Tts } from "../../services/Tts"

const links = [
	{ label: 'Invite me!', url: generalConfig.links.invite },
	{ label: 'Support server', url: generalConfig.links.supportServer },
	{ label: 'Github', url: generalConfig.links.gitRemoteRepo }
]

@Discord()
@injectable()
@Category('General')
export default class InfoCommand {

	constructor(
		private stats: Stats
	) {}

	@Slash({
		name: 'info',
		description: 'Botのひみつを表示します'
	})
	@Guard()
	async info(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {

		const embed = new EmbedBuilder()
			.setAuthor({
				name: interaction.user.username,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setTitle(client.user!.tag)
			.setThumbnail(client.user!.displayAvatarURL())
			.setColor(getColor('primary'))
			.setDescription(packageJSON.description)

		const fields: EmbedField[] = []

		/**
		 * Owner field
		 */
		const owner = await client.users.fetch(generalConfig.ownerId).catch(() => null)
		if (owner) {
			fields.push({
				name: 'Owner',
				value: `\`${owner.tag}\``,
				inline: true,
			})
		}

		/**
		 * Uptime field
		 */
		const uptime = timeAgo(new Date(Date.now() - client.uptime!))
		fields.push({
			name: 'Uptime',
			value: uptime,
			inline: true,
		})

		/**
		 * Totals field
		 */
		const totalStats = await this.stats.getTotalStats()
		fields.push({
			name: 'Totals',
			value: `**${totalStats.TOTAL_GUILDS}** guilds\n**${totalStats.TOTAL_USERS}** users\n**${totalStats.TOTAL_COMMANDS}** commands`,
			inline: true,
		})

		/**
		 * Bot version field
		 */
		fields.push({
			name: 'Bot version',
			value: `v${packageJSON.version}`,
			inline: true,
		})

		/**
		 * Framework/template field
		 */
		fields.push({
			name: 'Framework/template',
			value: `[TSCord](https://github.com/barthofu/tscord) (*v${generalConfig.__templateVersion}*)`,
			inline: true,
		})

		/**
		 * Libraries field
		 */
		fields.push({
			name: 'Libraries',
			value: `[discord.js](https://discord.js.org/) (*v${packageJSON.dependencies['discord.js'].replace('^', '')}*)\n[discordx](https://discordx.js.org/) (*v${packageJSON.dependencies['discordx'].replace('^', '')}*)`,
			inline: true,
		})

		// add the fields to the embed
		embed.addFields(fields)

		/**
		 * Define links buttons
		 */
		const buttons = links
			.map(link => {
				const url = link.url.split('_').join('')
				if (isValidUrl(url)) {
					return new ButtonBuilder()
						.setLabel(link.label)
						.setURL(url)
						.setStyle(ButtonStyle.Link)
				} else return null
			})
			.filter(link => link) as ButtonBuilder[]

		const select = new StringSelectMenuBuilder()
			.setCustomId('speaker_id')
			.setPlaceholder('声の選択')
		const tts = await resolveDependency(Tts)
		const list = await tts.getSpeakersInfo()
		list.getSpeakersList().forEach((speaker,i) => {
			//25個までしか選択肢に入れられない
			if(i >= 25) return false
			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(speaker.getName())
					.setValue(String(speaker.getIndex()))
					.setDefault(tts.getDefaultSpeakerId() === i)
			)
		})
			

		const row = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(...buttons)
		const row2 = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(select)
		
		
		// finally send the embed
		const res=await interaction.followUp({
			embeds: [embed],
			components: [row2,row],
		})
		const collector = res.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3600_000 });
		collector.on('collect', async i => {

			const member = interaction.member as GuildMember
			const current_channel = member.voice.channel as VoiceChannel
			const voiceChat = await resolveDependency(VoiceChat)

			await voiceChat.join(current_channel)
			const selection = i.values[0];
			tts.setDefaultSpeakerId(parseInt(selection))
			await i.reply(`${i.user} 声を変更したよ`)
			await tts.speak("声を変更したよ")
			await voiceChat.leave()
		})

	}
}