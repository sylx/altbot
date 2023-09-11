import { User } from "discord.js"
import { VoiceConnection,EndBehaviorType } from "@discordjs/voice";
import * as prism from "prism-media"
import {pipeline,Transform} from "node:stream"
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';
import * as fs from "node:fs"
import { Logger } from "@services"

import { Data } from "@entities"
import { Database } from "@services"
import { resolveDependency } from "@utils/functions"

import { Writable,WritableOptions } from "node:stream"


type ListeningStatus = {
    listening: boolean,
    user: User,
    timeout: NodeJS.Timeout | null,
}

let listeningStatus: {[key: string]: ListeningStatus} = {}


export async function listen(connection: VoiceConnection,user: User){
    if(listeningStatus[user.id] && listeningStatus[user.id].listening){
        return
    }
    if(!listeningStatus[user.id]){
        listeningStatus[user.id]={listening: false,user: user,timeout: null}
    }
    listeningStatus[user.id].listening=true
  
    try{
        const logger = await resolveDependency(Logger)
        logger.log(`listen start ${user.username}`,"info")

        const receiver = connection.receiver;
        const opusStream=receiver.subscribe(user.id, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 1_000,
            },
        })
        const opusDecoder=new prism.opus.Decoder({rate: 16000, channels: 1, frameSize: 960})
        const data = await streamToBuffer(opusStream.pipe(opusDecoder))
        receiver.subscriptions.delete(user.id)
        console.log("end")
	} catch (error) {
		console.warn(error);
	}
    listeningStatus[user.id].listening=false
}