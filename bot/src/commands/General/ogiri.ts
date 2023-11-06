import { Discord, Slash,SlashOption,SlashGroup } from "@decorators"
import { Guard } from "@guards"
import { injectable } from "tsyringe"
import { Category } from "@discordx/utilities"
import { CommandInteraction, Client, GuildMember, ChannelType, Collection, ApplicationCommandOptionType,  VoiceChannel } from "discord.js"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Gpt, Tts, VoiceChat } from "@services"
import { set } from "@tsed/schema"
@Discord()
@injectable()
@Category('General')
export default class OgiriCommand {

	constructor(
	) {}
	@Slash({
		name: 'ogiri',
		description: '強制的に大喜利を開始します'
	})  
	@Guard()
	async couple(
        @SlashOption({ name: 'テーマ', type: ApplicationCommandOptionType.String,description: "大喜利のテーマ",required: true }) theme: string,
        @SlashOption({ name: '対象者指定', type: ApplicationCommandOptionType.Mentionable,description: "大喜利の対象者を指定する（指定しない場合はランダム）",required: false }) target_member: GuildMember,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
        // 呼び出したメンバーの入っているチャンネルを取得
        const member = interaction.member as GuildMember
        const current_channel = member.voice.channel
		const voiceChat = await resolveDependency(VoiceChat)
        const tts = await resolveDependency(Tts)
        const gpt = await resolveDependency(Gpt)
        
        if(!current_channel){
            simpleErrorEmbed(
                interaction,
                `VCに入っていません`
            )
            return
        }
        let members = Array.from(current_channel.members.values())
        // お題とレビューの生成
        const ogiri=await gpt.makeOgiri(theme)
        if(!ogiri){
            simpleErrorEmbed(
                interaction,
                `お題の生成に失敗しました。もう一度実行してみたり、別のテーマを指定してみてください。`
            )
            return
        }

        target_member=target_member ?? members[Math.floor(Math.random() * members.length)]
        await voiceChat.join(current_channel)
        const start_text=`大喜利を始めます。${target_member.displayName}さん、お答えください。お題は「${ogiri.subject}」です。`
        interaction.channel?.send(start_text)
        await tts.speak(start_text)
        let count=10
        const review=async ()=>{
            const random=Math.floor(Math.random()*100)
            let review=""
            if(random < 40){
                review=ogiri.guilty_review
            }else if(random < 80){
                review=ogiri.warning_review
            }else{
                review=ogiri.correct_review
            }
            review=review.replace("{username}",target_member.displayName)
            interaction.channel?.send(review)
            await tts.speak(review)
            simpleSuccessEmbed(
                interaction,
                `大喜利完了　テーマは「${theme}」でした。${target_member.displayName}の解答評価は${random}点です`
            )              
        }
        const tick=async ()=>{
            setTimeout(async ()=>{
                await tts.speak(`${count--}`)
                if(count == 0){
                    setTimeout(review,5_000)
                }else{
                    tick()
                }
            })
        }
        tick()
    }
}
