import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType, TextBasedChannel } from "discord.js"
import { Client } from "discordx"

import { Discord, Guard, Slash, SlashOption } from "@decorators"
import { Disabled } from "@guards"
import { simpleSuccessEmbed,simpleErrorEmbed} from "@utils/functions"

import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"
import { VoiceChat } from "../../services/VoiceChat"
import { Tts } from "../../services/Tts"
import { TranscribedData } from "../../utils/functions/listen"


const FORCE_OUTPUT_LOG_TIMEOUT = 5*60*1000 //5分

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
		const targetChannel=interaction.channel
		let timeoutAfterReceive : NodeJS.Timeout | null = null
		voiceChat.on("transcribed",async (data: TranscribedData)=>{
			timeoutAfterReceive && clearTimeout(timeoutAfterReceive)
			appendLog(data)
			//ログの出力
			outputLog(targetChannel as TextBasedChannel)
			//5分後の予約
			timeoutAfterReceive = setTimeout(()=>{
				outputLog(targetChannel as TextBasedChannel)
			},FORCE_OUTPUT_LOG_TIMEOUT)
		})
		voiceChat.on("disconnect",async ()=>{
			clearLog()
		})

		await voiceChat.startListen()
		simpleSuccessEmbed(
			interaction,
			"聞き取りを開始します"
		)
		tts.speak("聞き取りを開始します")
	}
}

const transcribedLogs: Array<TranscribedData> = []
const transcribedLogsLimit = 100

function appendLog(log : TranscribedData){
	const index = transcribedLogs.findIndex((item) => item.id === log.id)
	if(index >= 0){
		const old = transcribedLogs[index]
		if(old.written){
			// 既に書き出されているので修正する
			const msg=old.written
			const logInMessage = transcribedLogs.filter(item=>item.written?.id === msg.id)
			msg.edit(createLogText(logInMessage)).then(()=>{
				console.log(`edit ${msg.id}`)
			})
		}
		transcribedLogs[index] = log
	}else{
		transcribedLogs.push(log)
	}
	while(transcribedLogs.length > transcribedLogsLimit){
		transcribedLogs.shift()
	}
}

function clearLog(){
	transcribedLogs.length = 0
}

async function outputLog(targetChannel?: TextBasedChannel){
	const logToBeSent=transcribedLogs.filter(item=>!item.written)
	//5件以上たまった or 最後のログが5分以上経過したログを書き出す
	if(logToBeSent.length > 5 || (logToBeSent.length > 0 && Date.now() - logToBeSent[logToBeSent.length-1].timestamp > FORCE_OUTPUT_LOG_TIMEOUT)){
		const msg = await targetChannel?.send(createLogText(logToBeSent))
		logToBeSent.forEach(item=>{
			item.written=msg
		})
	}
}

function createLogText(logs: Array<TranscribedData>) : string{
	const leftZeroPad = (num: number, length: number) => {
		return (Array(length).join('0') + num).slice(-length);
	}
	const timeStr=(time_msec: number)=>{
		const time = new Date(time_msec)

		return `${leftZeroPad(time.getHours(),2)}:${leftZeroPad(time.getMinutes(),2)}:${leftZeroPad(time.getSeconds(),2)}`
	}
	return logs.map(log=>`${timeStr(log.timestamp)} ${log.member.displayName} : ${log.text}`).join("\n")
}