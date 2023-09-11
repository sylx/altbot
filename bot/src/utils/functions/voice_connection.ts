import {
    VoiceConnection, createAudioPlayer,
    createAudioResource, StreamType,
    VoiceConnectionStatus, entersState,
    AudioPlayerStatus, getVoiceConnections,
} from "@discordjs/voice"
import { resolveDependencies, resolveDependency } from "@utils/functions"
import { Logger } from "@services"
import { Readable } from "stream"
import { resolve } from "path"
import { Snowflake } from "discord.js"
import { Client } from "discordx"
import { listen } from "../../utils/functions/listen"
import * as fs from "node:fs"

process.on("exit", async () => {
    getVoiceConnections().forEach(connection => {
        connection.destroy()
    })
})

const player = createAudioPlayer({
    debug: true
})

export const registerConnections = async (connection: VoiceConnection,client: Client) => {
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
    connection.subscribe(player)
    connection.receiver.speaking.on('start', (userId) => {
        const user = client.users.cache.get(userId)
        if (user) {
            listen(connection, user)
        }
    })
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
}

export const play = async (url: string) => {

    const resource = createAudioResource(url, {
        inputType: StreamType.Arbitrary,
    });
    player.play(resource)
    await entersState(player, AudioPlayerStatus.Playing, 5000);
}

export const leaveAll = async () => {
    getVoiceConnections().forEach(connection => {
        connection.destroy()
    })
}

