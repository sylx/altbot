
import { delay, inject, singleton } from "tsyringe"

import {
    VoiceConnection, createAudioPlayer,AudioPlayer,
    createAudioResource, StreamType,joinVoiceChannel,
    VoiceConnectionStatus, entersState,
    AudioPlayerStatus, getVoiceConnections,
} from "@discordjs/voice"

import { Channel, VoiceChannel } from "discord.js"
import { Client } from "discordx"
import { listen } from "../utils/functions/listen"


@singleton()
export class VoiceChat {
    connection : VoiceConnection | null = null
    channel : VoiceChannel | null = null
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
    isEnable() : boolean{
        return this.connection !== null
    }

    async join(channel: VoiceChannel) : Promise<void>{
        await this.leave()
        const connection = joinVoiceChannel({
			adapterCreator: channel.guild.voiceAdapterCreator,
			channelId: channel.id,
			guildId: channel.guild.id,
			debug: true
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
            const user = this.client.users.cache.get(userId)
            const member = this.channel?.guild.members.cache.get(userId) as GuildMember
            if (user) {
                listen(connection, user, member)
            }
        })
    }

    async initVoiceConnection(conn: VoiceConnection) : Promise<void>{
        await entersState(conn, VoiceConnectionStatus.Ready, 30_000)
        // set reconnect
        conn.on("stateChange",async (oldState, newState) => {        
            const status = newState.status
            if (status === VoiceConnectionStatus.Disconnected){
                // reconnect
                console.log("reconnecting...")
                try {
                    await Promise.race([
                        entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                    // Seems to be reconnecting to a new channel - ignore disconnect
                } catch (error) {
                    // Seems to be a real disconnect which SHOULDN'T be recovered from
                    this.leave()
                }
            }
        })

    }
}
