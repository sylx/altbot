
import { delay, inject, singleton } from "tsyringe"

import {
    VoiceConnection, createAudioPlayer,AudioPlayer,
    createAudioResource, StreamType,joinVoiceChannel,
    VoiceConnectionStatus, entersState,
    AudioPlayerStatus, getVoiceConnections,
} from "@discordjs/voice"

import { Channel, VoiceChannel,GuildMember } from "discord.js"
import { Client } from "discordx"
import { listen } from "../utils/functions/listen"

import { EventEmitter } from "events"

@singleton()
export class VoiceChat {
    connection : VoiceConnection | null = null
    channel : VoiceChannel | null = null
    emitter: EventEmitter = new EventEmitter()
    player : AudioPlayer = createAudioPlayer({
        debug: true
    })
    constructor(
        @inject(delay(() => Client)) private client: Client,
    ) {
        process.on("exit", async () => {
            await this.leave()
        })
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

    async join(channel: VoiceChannel) : Promise<void>{
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
    }
    async leave() : Promise<void>{
        this.connection?.destroy()
        this.connection=null
        this.channel=null
    }

    async startListen() : Promise<void>{
        if(this.connection === null) throw "yet join voice channel"
        const connection=this.connection as VoiceConnection

        connection.receiver.speaking.on('start', (userId) => {
            const member = this.channel?.guild.members.cache.get(userId) as GuildMember
            if (member) {
                listen(connection, member, this.emitter)
            }
        })
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
                    throw new Error("disconnected and reconnecting was failed")
                }
            }
        })

    }
}
