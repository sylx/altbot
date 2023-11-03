import { Discord, Slash,SlashOption } from "@decorators"
import { Guard } from "@guards"
import { injectable } from "tsyringe"
import { Category } from "@discordx/utilities"
import { CommandInteraction, Client, GuildMember, ChannelType, Collection, ApplicationCommandOptionType,  VoiceChannel } from "discord.js"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Tts, VoiceChat } from "@services"
@Discord()
@injectable()
@Category('General')

export default class DeleteCommand {

	constructor(
	) {}
	@Slash({
		name: 'couple',
		description: '現在VCにいるメンバーをランダムに専用チャンネルに隔離します'
	})
	@Guard()
	async couple(
        @SlashOption({ name: '隔離メッセージ', type: ApplicationCommandOptionType.String,description: "隔離した二人に読み上げるメッセージ",required: true }) message: string,
        @SlashOption({ name: '全員対象', type: ApplicationCommandOptionType.Boolean,description: "VCにいる全員を対象にするかどうか",required: false}) all: boolean,
        @SlashOption({ name: '隔離チャンネル', type: ApplicationCommandOptionType.Channel,channelTypes: [ChannelType.GuildVoice],description: "隔離するチャンネル",required: false }) target_channel: VoiceChannel,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
        // 呼び出したメンバーの入るチャンネルを取得
        const member = interaction.member as GuildMember
        const current_channel = member.voice.channel 
		const voiceChat = await resolveDependency(VoiceChat)
        const tts = await resolveDependency(Tts)
        
        if(!current_channel){
            simpleErrorEmbed(
                interaction,
                `VCに入っていません`
            )
            return
        }
        const parent = current_channel?.parent
        const channels = Array.from(member.guild.channels.cache.values())
                            .filter(channel => channel.type === ChannelType.GuildVoice)
        let members = channels.map(channel => {
                                const members=channel.members as Collection<string,GuildMember>
                                return Array.from(members.values())
                            }).flat()
        await voiceChat.join(current_channel)
        await tts.speak("今から10秒後にランダムで二人を隔離します。お幸せにね！")
                    
        let count=10
        let couple_index = 0
        const tick=()=>{
            setTimeout(async ()=>{
                await tts.speak(`${count--}`)
                if(count == 0){
                    // チャンネルの作成
                    let new_channel = target_channel                    
                    if(all || !target_channel){
                        new_channel = await member.guild.channels.create({
                            name: `カップルチャンネル - ${couple_index+1}`,
                            type: ChannelType.GuildVoice,
                            parent: parent
                        })
                    }

                    //ランダムで二人選ぶ
                    let number = 2
                    if(all && members.length == 3){
                        number = 3
                    }
                    const couple = members.sort(() => Math.random() - 0.5).slice(0,number)
                    await Promise.all(couple.map(member=>{
                        return member.voice.setChannel(new_channel)
                    }))
                    // coupleをmembersから消す
                    members = members.filter(member => couple.map(couple_member=>couple_member.id).indexOf(member.id) == -1)

                    await voiceChat.join(new_channel)
                    await tts.speak(message)
                    simpleSuccessEmbed(
                        interaction,
                        `${couple.map(member=>member.displayName).join("と")}を隔離しました(${message})`
                    )
                    if(all && members.length > 0){
                        await voiceChat.join(current_channel)
                        await tts.speak("10秒後に次のカップルを隔離します。震えて眠れ！")                                        
                        count=10
                        tick()
                    }
                }else{
                    tick()
                }
            },1000)
        }
        tick()
    }
}
