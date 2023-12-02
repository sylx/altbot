import { Discord, Slash,SlashOption,SlashGroup } from "@decorators"
import { Guard } from "@guards"
import { injectable } from "tsyringe"
import { Category } from "@discordx/utilities"
import { CommandInteraction, Client, GuildMember, ChannelType, Collection, ApplicationCommandOptionType,  VoiceChannel } from "discord.js"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Gpt, QuestionAssistantData, QuetionSessionData, Transcription, Tts, VoiceChat } from "@services"
import { TtsService } from "grpc/tts_grpc_pb"

let excuting=false

@Discord()
@injectable()
@Category('General')
export default class QuestionCommand {

	constructor(
	) {}
	@Slash({
		name: 'question',
		description: '尋問を開始します'
	})  
	@Guard()
	async question(
        @SlashOption({ name: '情報', type: ApplicationCommandOptionType.String,description: "対象者から引き出す情報（年齢、体重など）",required: true }) theme: string,        
        @SlashOption({ name: '対象者指定', type: ApplicationCommandOptionType.Mentionable,description: "尋問の対象者を指定する（指定しない場合はランダム）",required: false }) target_member: GuildMember,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
        if(excuting){
            simpleErrorEmbed(
                interaction,
                `現在他の尋問を実行中です`
            )
            return
        }
        excuting=true

        // 呼び出したメンバーの入っているチャンネルを取得
        const member = interaction.member as GuildMember
        const current_channel = member.voice.channel as VoiceChannel
		const voiceChat = await resolveDependency(VoiceChat)
        const transcription = await resolveDependency(Transcription)
        const tts = await resolveDependency(Tts)
        const gpt = await resolveDependency(Gpt)
        
        if(!current_channel){
            simpleErrorEmbed(
                interaction,
                `VCに入っていません`
            )
            excuting=false
            return
        }
        let members = Array.from(current_channel.members.values())

        target_member=target_member ?? members[Math.floor(Math.random() * members.length)]
        await voiceChat.join(current_channel)
        const conn = voiceChat.getConnection()
        if(!conn){
            simpleErrorEmbed(
                interaction,
                `接続できません`
            )
            excuting=false
            return
        }
        let session : QuetionSessionData | [] =[]
        while(true){
            session=await gpt.question(target_member.displayName,theme,session) as QuetionSessionData
            console.log(session)
            const last_assistant=session[session.length-1]?.data as QuestionAssistantData
            if(!last_assistant){
                simpleErrorEmbed(
                    interaction,
                    `尋問の生成に失敗しました。もう一度実行してみたり、別の情報を指定してみてください。`
                )
                excuting=false
                return
            }
            if(last_assistant.complete) break
            await tts.speak(last_assistant.text)
            const prompt = `Q:「${last_assistant.text}」\nA:「`
            const transcribe_result=await transcription.transcribeMember(conn,target_member,1700,"")              
            session.push({
                role: "user",
                data: {
                    text: transcribe_result.text,
                    probability: transcribe_result.probability
                }
            })
        }
        const last_assistant=session[session.length-1]?.data as QuestionAssistantData
        const acquired_info=last_assistant.acquired_info
        await tts.speak(last_assistant.text)
        let result=""
        if(Array.isArray(acquired_info)){
            result=acquired_info.join("\n")
        }else{
            result=acquired_info
        }
        simpleSuccessEmbed(
            interaction,
            `尋問を完了：${target_member.displayName}の以下の情報を入手しました。\n${result}`
        )
        excuting=false
    }
}
