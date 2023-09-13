import {
    VoiceConnection, createAudioPlayer,
    createAudioResource, StreamType,
    VoiceConnectionStatus, entersState,
    AudioPlayerStatus, getVoiceConnections,
} from "@discordjs/voice"
import { Guild, GuildMember,VoiceChannel } from "discord.js"
import { resolveDependencies, resolveDependency } from "@utils/functions"
import { Logger } from "@services"
import { Readable } from "stream"
import { resolve } from "path"
import { Snowflake } from "discord.js"
import { Client } from "discordx"
import { listen } from "../../utils/functions/listen"
import * as fs from "node:fs"
import { Tts } from "../../services/Tts"

process.on("exit", async () => {
    getVoiceConnections().forEach(connection => {
        connection.destroy()
    })
})

export const registerConnections = async (connection: VoiceConnection,channel: VoiceChannel,client: Client) => {
    const tts=await resolveDependency(Tts)
    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('The connection has entered the Ready state - ready to play audio!');
    });
    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
        }
    });
    
    tts.setConnection(connection)
 
    connection.receiver.speaking.on('start', (userId) => {
        const user = client.users.cache.get(userId)
        const member = channel.guild.members.cache.get(userId) as GuildMember
        if (user) {
            listen(connection, user, member)
        }
    })
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
}

export const leaveAll = async () => {
    getVoiceConnections().forEach(connection => {
        connection.destroy()
    })
}

