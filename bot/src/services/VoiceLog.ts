/**
 * VoiceLog service
 * 会話ログを記録して、TextChannel に送信するサービス
 */
import { GuildMember, Message, TextBasedChannel } from "discord.js";
import { singleton } from "tsyringe";

export interface TranscribedData{
    id: string,
    timestamp: number,
    member?: GuildMember,
    displayName?: string,
    text: string,
    written?: Message<boolean> // 送信済みの場合は 出力済みMessage Object
}


@singleton()
export class VoiceLog {
    protected transcribedLogs: Array<TranscribedData> = []
    protected readonly transcribedLogsLimit = 100
    protected targetChannel?: TextBasedChannel
    protected last_msg: Message<boolean> | null
    constructor(channel: TextBasedChannel) {
        this.last_msg = null
    }

    setChannel(channel: TextBasedChannel){
        this.targetChannel = channel
    }
    
    async appendLog(log : TranscribedData){
        const index = this.transcribedLogs.findIndex((item) => item.id === log.id)
        if(index >= 0){
            const old = this.transcribedLogs[index]
            log.written = old.written
            this.transcribedLogs[index] = log
            if(old.written){
                // 既に書き出されているので修正する
                const msg=old.written
                const logInMessage = this.transcribedLogs.filter(item=>item.written?.id === msg.id)
                await msg.edit(this.createLogText(logInMessage))
            }
        }else{
            this.transcribedLogs.push(log)
            await this.outputLog()
        }
        // 保存件数を制限する
        while(this.transcribedLogs.length > this.transcribedLogsLimit){
            this.transcribedLogs.shift()
        }
    }
    
    clearLog(){
        this.transcribedLogs.length = 0
    }
    
    protected async outputLog(){
        const logToBeSent=this.transcribedLogs.filter(item=>!item.written)
        const logToBeSentLength = logToBeSent.reduce((a,b)=>a+b.text.length,0)
        const now = Date.now()
        if(logToBeSent.length > 0){
            const last_msg_log=this.last_msg ? this.transcribedLogs.filter(item=>item.written?.id === this.last_msg?.id) : null
            if(this.last_msg && last_msg_log && last_msg_log.length < 10 && this.last_msg.content.length + logToBeSentLength < 2000){
                // 10行以内で、2000文字以内なら前回のメッセージに追加する
                await this.last_msg.edit(this.createLogText(last_msg_log.concat(logToBeSent)))
            }else{
                // 新しいメッセージを作成する
                const msg=
                    await this.targetChannel?.send(this.createLogText(logToBeSent)) as Message<boolean>
                if(msg){
                    this.last_msg=msg
                }
            }
            if(this.last_msg){
                //送信済みをマーク
                logToBeSent.forEach(log=>{
                    log.written=this.last_msg as Message<boolean>
                })
            }
        }
    }
    
    createLogText(logs: Array<TranscribedData>) : string{
        const leftZeroPad = (num: number, length: number) => {
            return (Array(length).join('0') + num).slice(-length);
        }
        const timeStr=(time_msec: number)=>{
            const time = new Date(time_msec)
    
            return `${leftZeroPad(time.getHours(),2)}:${leftZeroPad(time.getMinutes(),2)}:${leftZeroPad(time.getSeconds(),2)}`
        }
        const displayName = (log: TranscribedData) => {
            return log.member ? log.member.displayName : log.displayName
        }
        return logs.sort((a,b)=>a.timestamp-b.timestamp)
                    .map(log=>`${timeStr(log.timestamp)} ${displayName(log)} : ${log.text}`).join("\n")
    }
}
