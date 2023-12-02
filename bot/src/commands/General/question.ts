import { Discord, Slash,SlashOption,SlashGroup } from "@decorators"
import { Guard } from "@guards"
import { injectable } from "tsyringe"
import { Category } from "@discordx/utilities"
import { CommandInteraction, Client, GuildMember, ChannelType, Collection, ApplicationCommandOptionType,  VoiceChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, ComponentType } from "discord.js"
import { resolveDependency, simpleErrorEmbed, simpleSuccessEmbed } from "@utils/functions"
import { Gpt, QuestionAssistantData, QuestionUserData, QuetionSessionData, Transcription, Tts, VoiceChat } from "@services"
import { EventEmitter } from "events"

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
        let session : QuetionSessionData | [] = []
        const ui_emitter= new EventEmitter()
        let current : QuestionUserData | null = null
        let current_id : string | null = null

        while(true){
            session=await gpt.question(target_member.displayName,theme,session) as QuetionSessionData
            console.log(session)
            this.updateEmbed(interaction,session as QuetionSessionData,target_member,ui_emitter)
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

            current={
                text: "<聞き取り中...>",
                probability: 0
            } as QuestionUserData
            (session as QuetionSessionData).push({
                role: "user",
                data: current
            })
            current_id=null
            this.updateEmbed(interaction,session as QuetionSessionData,target_member,ui_emitter)

            const prompt = `${members.map((member)=>{member.displayName}).join("、")}`
            const transcribe_emitter=await transcription.transcribeMember(conn,target_member,1700,prompt)
            ui_emitter.on("submit",()=>{
                transcribe_emitter.emit("flush")
                transcribe_emitter.emit("terminate")
                this.updateEmbed(interaction,session as QuetionSessionData,target_member,ui_emitter)
            })
            ui_emitter.on("retry",()=>{
                transcribe_emitter.emit("terminate")
                let last
                do{
                    last=session.pop()
                }while(last?.role !== "assistant")
                this.updateEmbed(interaction,session as QuetionSessionData,target_member,ui_emitter)
            })
            await new Promise<void>((resolve,reject)=>{
                transcribe_emitter.on("result",(result)=>{
                    console.log({result,current,current_id})
                    if(current_id && current_id !== result.id) return
                    if(!current_id && current){
                        current_id = result.id
                        current.text = result.text
                        current.probability = result.probability
                    }else if(current){
                        current.text = result.text
                        current.probability = result.probability
                    }
                    this.updateEmbed(interaction,session as QuetionSessionData,target_member,ui_emitter)
                })
                transcribe_emitter.on("terminate",()=>{
                    resolve()
                })
            })
            ui_emitter.removeAllListeners()            
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
        //await voiceChat.leave()
        excuting=false
    }
    async updateEmbed(interaction: CommandInteraction,session: QuetionSessionData,target_member: GuildMember,emitter?: EventEmitter){
        const last_assistant=session[session.length-1]?.data as QuestionAssistantData
        const is_complete=last_assistant.complete
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(is_complete ? `尋問結果` : `尋問中…`)
            .setDescription(`対象者：${target_member.displayName}`)
            .setFields(session.map(item=>{
                    return {
                        name: item.role == "assistant" ? "altbot" : target_member.displayName,
                        value: item.data.text,                        
                        inline: false
                    }
                }))
            .setThumbnail(target_member.user.displayAvatarURL())
        const buttons = [
            new ButtonBuilder()
                .setLabel('これで回答する')
                .setStyle(ButtonStyle.Primary)
                .setCustomId('submit')
                .setDisabled(session[session.length - 1].role !== "user" ||
                                 (session[session.length - 1].data as QuestionUserData).probability === 0),
            new ButtonBuilder()
                .setLabel('回答をやり直す')
                .setStyle(ButtonStyle.Danger)
                .setCustomId('retry')
                .setDisabled(session.filter(item=>item.role === "user" && item.data.probability > 0).length === 0)
        ]
        const row=new ActionRowBuilder<ButtonBuilder>()
            .addComponents(...buttons)
        const msg = await interaction.editReply({
            embeds: [embed],
            //components: [row]
        })
        if(!emitter) return msg

        const collector=msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 })
        collector.on('collect', async i => {
            if(i.user.id !== target_member.user.id) return
            if(i.customId === "submit"){
                emitter.emit("submit")
            }else if(i.customId === "retry"){
                emitter.emit("retry")
            }
        })
        return msg
    }
}
