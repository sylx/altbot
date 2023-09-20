// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class DiscordOpusPacket extends jspb.Message { 
    getTimestamp(): number;
    setTimestamp(value: number): DiscordOpusPacket;
    getSpeakerId(): string;
    setSpeakerId(value: string): DiscordOpusPacket;
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): DiscordOpusPacket;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DiscordOpusPacket.AsObject;
    static toObject(includeInstance: boolean, msg: DiscordOpusPacket): DiscordOpusPacket.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DiscordOpusPacket, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DiscordOpusPacket;
    static deserializeBinaryFromReader(message: DiscordOpusPacket, reader: jspb.BinaryReader): DiscordOpusPacket;
}

export namespace DiscordOpusPacket {
    export type AsObject = {
        timestamp: number,
        speakerId: string,
        data: Uint8Array | string,
    }
}

export class DiscordOpusPacketList extends jspb.Message { 
    clearPacketsList(): void;
    getPacketsList(): Array<DiscordOpusPacket>;
    setPacketsList(value: Array<DiscordOpusPacket>): DiscordOpusPacketList;
    addPackets(value?: DiscordOpusPacket, index?: number): DiscordOpusPacket;
    getIsFinal(): boolean;
    setIsFinal(value: boolean): DiscordOpusPacketList;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DiscordOpusPacketList.AsObject;
    static toObject(includeInstance: boolean, msg: DiscordOpusPacketList): DiscordOpusPacketList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DiscordOpusPacketList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DiscordOpusPacketList;
    static deserializeBinaryFromReader(message: DiscordOpusPacketList, reader: jspb.BinaryReader): DiscordOpusPacketList;
}

export namespace DiscordOpusPacketList {
    export type AsObject = {
        packetsList: Array<DiscordOpusPacket.AsObject>,
        isFinal: boolean,
    }
}

export class TranscribedText extends jspb.Message { 
    getBegin(): number;
    setBegin(value: number): TranscribedText;
    getEnd(): number;
    setEnd(value: number): TranscribedText;
    getPacketTimestamp(): number;
    setPacketTimestamp(value: number): TranscribedText;
    getSpeakerId(): string;
    setSpeakerId(value: string): TranscribedText;
    getText(): string;
    setText(value: string): TranscribedText;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscribedText.AsObject;
    static toObject(includeInstance: boolean, msg: TranscribedText): TranscribedText.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscribedText, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscribedText;
    static deserializeBinaryFromReader(message: TranscribedText, reader: jspb.BinaryReader): TranscribedText;
}

export namespace TranscribedText {
    export type AsObject = {
        begin: number,
        end: number,
        packetTimestamp: number,
        speakerId: string,
        text: string,
    }
}
