
import { delay, inject } from "tsyringe"

import {
    VoiceConnection, createAudioPlayer, AudioPlayer, joinVoiceChannel,
    VoiceConnectionStatus, entersState
} from "@discordjs/voice"

import { VoiceChannel } from "discord.js"
import { Client } from "discordx"

import { EventEmitter } from "events"
import { IGuildDependent, guildScoped } from "@utils/functions"

@guildScoped()
export class VoiceChat implements IGuildDependent{
    protected connection : VoiceConnection | null = null
    protected channel : VoiceChannel | null = null
    protected emitter: EventEmitter = new EventEmitter()
    protected player : AudioPlayer = createAudioPlayer({
        debug: true
    })
    constructor(
        @inject(delay(() => Client)) private client: Client,
    ) {
        process.on("exit", async () => {
            await this.leave()
        })
    }

    getGuildId() : string | null{
        return this.connection?.joinConfig.guildId ?? null
    }

    getConnection() : VoiceConnection | null{
        return this.connection
    }
    getChannel() : VoiceChannel | null{
        return this.channel
    }
    getPlayer() : AudioPlayer{
        return this.player
    }
    isEnable() : boolean{
        return this.connection !== null
    }
    on(event: string, listener: (...args: any[]) => void) : void{
        this.emitter.on(event,listener)
    }

    async join(channel: VoiceChannel) : Promise<VoiceConnection>{
        await this.leave()
        const connection = joinVoiceChannel({
			adapterCreator: channel.guild.voiceAdapterCreator,
			channelId: channel.id,
			guildId: channel.guild.id,
			debug: true
		})
        connection.on("stateChange",async (oldState, newState) => {
            if(oldState.status === newState.status) return
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}.`)
            if(newState.status !== VoiceConnectionStatus.Ready){
                try{
                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
                }catch(e){
                    console.error(e)
                    console.log("connection?",connection.state.status)
                }
            }
        })
        await this.initVoiceConnection(connection)
        this.connection=connection
        this.channel=channel
        return connection
    }
    async leave() : Promise<void>{
        this.connection?.destroy()
        this.connection=null
        this.channel=null
        this.emitter.emit("disconnect")
    }

    protected async initVoiceConnection(conn: VoiceConnection) : Promise<void>{
        conn.subscribe(this.player)
        try{
            await entersState(conn, VoiceConnectionStatus.Ready, 30_000)
        }catch(e){
            console.error(e)
            throw new Error("failed to connect voice channel")
        }
        // set reconnect
        conn.on("stateChange",async (oldState, newState) => {
            if(oldState.status === newState.status) return
            const status = newState.status
            if (status === VoiceConnectionStatus.Disconnected){
                // reconnect
                console.log("reconnecting...")
                try {
                    await Promise.race([
                        entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                    console.log("state to ",conn.state.status)
                    // Seems to be reconnecting to a new channel - ignore disconnect
                    await entersState(conn, VoiceConnectionStatus.Ready, 20_000);
                    console.log("reconnected!")
                } catch (error) {
                    console.error(error)
                    this.leave()
                    throw new Error("disconnected and reconnecting was failed")
                }
            }
        })

    }
}
