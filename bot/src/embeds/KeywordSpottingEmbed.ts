import { CommandInteraction, EmbedBuilder,ButtonBuilder,ButtonStyle,ActionRowBuilder,ComponentType, Message } from "discord.js";
import { KeywordSpottingFoundEvent } from "@services";

export async function KeywordSpottingEmbed(interaction: CommandInteraction,keyword: string,
    event_log: KeywordSpottingFoundEvent[],abortController?: AbortController): Promise<Message>{
    const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle("キーワード検出結果")
        .setDescription(`設定キーワード:${keyword}`)
        .setFields(event_log.map(item=>{
                const displayName=item.speaker_id ? interaction?.guild?.members.cache.get(item.speaker_id)?.displayName : "不明"
                return {
                    name: `${item.keyword} (${new Date(item.timestamp).toLocaleTimeString('ja-JP', { hour12: false })})`,
                    value: `確度: ${item.probability} 発言者: ${displayName}`,
                    inline: false
                }
            }))
    const buttons = [
        new ButtonBuilder()
            .setLabel('停止')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('stop')
    ]
    const row=new ActionRowBuilder<ButtonBuilder>()
        .addComponents(...buttons)
    
    const msg = await interaction.editReply({
        embeds: [embed],
        components: abortController ? [row] : []
    })

    if(abortController){
        const collector=msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 })
        const timeout=setTimeout(()=>{
            KeywordSpottingEmbed(interaction,keyword,event_log)
            collector.stop()
        },300_000)

        collector.on('collect', async i => {
            if(i.customId === "stop"){
                clearTimeout(timeout)
                KeywordSpottingEmbed(interaction,keyword,event_log)
                abortController.abort()
            }
        })
    }
    return msg
}