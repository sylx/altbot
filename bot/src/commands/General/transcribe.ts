import { ApplicationCommandOptionType, Channel, CommandInteraction, VoiceChannel, ClientVoiceManager, Snowflake, ChannelType, TextBasedChannel, Message } from "discord.js"
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
import { Transcription } from "../../services/Transcription"
import { VoiceConnection } from "@discordjs/voice"


const COMBINED_LOG_DURATION = 5*60*1000 //5分

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
		const transcription = await resolveDependency(Transcription)
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
		transcription.on("transcribed",async (data: any)=>{
			timeoutAfterReceive && clearTimeout(timeoutAfterReceive)
			appendLog(data)
			//ログの出力
			outputLog(targetChannel as TextBasedChannel)
		})
		voiceChat.on("disconnect",async ()=>{
			clearLog()
		})

		await transcription.startListen(
			voiceChat.getConnection() as VoiceConnection,
			voiceChat.getChannel() as VoiceChannel)

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

let last_msg : Message<boolean> | null = null
let last_msg_timestamp : number | null = null

async function outputLog(targetChannel?: TextBasedChannel){
	const logToBeSent=transcribedLogs.filter(item=>!item.written)
	const now = Date.now()
	if(logToBeSent.length > 0){
		//前回からの経過時間がCOMBINED_LOG_DURATIONを超えていない場合は前回のメッセージに追記する
		if(
			last_msg && last_msg_timestamp && 
			(now - last_msg_timestamp < COMBINED_LOG_DURATION)
		){
			await last_msg.edit(last_msg.content + "\n" + createLogText(logToBeSent))
		}else{
			// 新しいメッセージを作成する
			const msg=
				await targetChannel?.send(createLogText(logToBeSent)) as Message<boolean>
			if(msg){
				last_msg=msg
				last_msg_timestamp=now
			}
		}
		if(last_msg){
			//送信済みをマーク
			logToBeSent.forEach(log=>{
				log.written=last_msg as Message<boolean>
			})
		}
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