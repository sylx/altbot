// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class DiscordOpusPacket extends jspb.Message { 
    getTimestamp(): number;
    setTimestamp(value: number): DiscordOpusPacket;
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
        data: Uint8Array | string,
    }
}

export class DiscordOpusPacketList extends jspb.Message { 
    clearPacketsList(): void;
    getPacketsList(): Array<DiscordOpusPacket>;
    setPacketsList(value: Array<DiscordOpusPacket>): DiscordOpusPacketList;
    addPackets(value?: DiscordOpusPacket, index?: number): DiscordOpusPacket;
    getSpeakerId(): string;
    setSpeakerId(value: string): DiscordOpusPacketList;
    getPrompt(): string;
    setPrompt(value: string): DiscordOpusPacketList;
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
        speakerId: string,
        prompt: string,
        isFinal: boolean,
    }
}

export class TranscriptionEvent extends jspb.Message { 
    getEventname(): string;
    setEventname(value: string): TranscriptionEvent;
    getEventdata(): string;
    setEventdata(value: string): TranscriptionEvent;
    getOpusdata(): Uint8Array | string;
    getOpusdata_asU8(): Uint8Array;
    getOpusdata_asB64(): string;
    setOpusdata(value: Uint8Array | string): TranscriptionEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionEvent.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionEvent): TranscriptionEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionEvent;
    static deserializeBinaryFromReader(message: TranscriptionEvent, reader: jspb.BinaryReader): TranscriptionEvent;
}

export namespace TranscriptionEvent {
    export type AsObject = {
        eventname: string,
        eventdata: string,
        opusdata: Uint8Array | string,
    }
}

export class KeywordSpottingRequestConfig extends jspb.Message { 
    clearKeywordList(): void;
    getKeywordList(): Array<string>;
    setKeywordList(value: Array<string>): KeywordSpottingRequestConfig;
    addKeyword(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingRequestConfig.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingRequestConfig): KeywordSpottingRequestConfig.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingRequestConfig, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingRequestConfig;
    static deserializeBinaryFromReader(message: KeywordSpottingRequestConfig, reader: jspb.BinaryReader): KeywordSpottingRequestConfig;
}

export namespace KeywordSpottingRequestConfig {
    export type AsObject = {
        keywordList: Array<string>,
    }
}

export class KeywordSpottingRequestAudio extends jspb.Message { 
    getData(): Uint8Array | string;
    getData_asU8(): Uint8Array;
    getData_asB64(): string;
    setData(value: Uint8Array | string): KeywordSpottingRequestAudio;
    getSpeakerId(): string;
    setSpeakerId(value: string): KeywordSpottingRequestAudio;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingRequestAudio.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingRequestAudio): KeywordSpottingRequestAudio.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingRequestAudio, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingRequestAudio;
    static deserializeBinaryFromReader(message: KeywordSpottingRequestAudio, reader: jspb.BinaryReader): KeywordSpottingRequestAudio;
}

export namespace KeywordSpottingRequestAudio {
    export type AsObject = {
        data: Uint8Array | string,
        speakerId: string,
    }
}

export class KeywordSpottingRequest extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): KeywordSpottingRequestConfig | undefined;
    setConfig(value?: KeywordSpottingRequestConfig): KeywordSpottingRequest;

    hasAudio(): boolean;
    clearAudio(): void;
    getAudio(): KeywordSpottingRequestAudio | undefined;
    setAudio(value?: KeywordSpottingRequestAudio): KeywordSpottingRequest;

    getRequestOneofCase(): KeywordSpottingRequest.RequestOneofCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingRequest.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingRequest): KeywordSpottingRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingRequest;
    static deserializeBinaryFromReader(message: KeywordSpottingRequest, reader: jspb.BinaryReader): KeywordSpottingRequest;
}

export namespace KeywordSpottingRequest {
    export type AsObject = {
        config?: KeywordSpottingRequestConfig.AsObject,
        audio?: KeywordSpottingRequestAudio.AsObject,
    }

    export enum RequestOneofCase {
        REQUEST_ONEOF_NOT_SET = 0,
        CONFIG = 1,
        AUDIO = 2,
    }

}

export class KeywordSpottingFound extends jspb.Message { 
    getKeyword(): string;
    setKeyword(value: string): KeywordSpottingFound;
    getProbability(): number;
    setProbability(value: number): KeywordSpottingFound;
    getSpeakerId(): string;
    setSpeakerId(value: string): KeywordSpottingFound;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingFound.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingFound): KeywordSpottingFound.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingFound, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingFound;
    static deserializeBinaryFromReader(message: KeywordSpottingFound, reader: jspb.BinaryReader): KeywordSpottingFound;
}

export namespace KeywordSpottingFound {
    export type AsObject = {
        keyword: string,
        probability: number,
        speakerId: string,
    }
}

export class KeywordSpottingResponse extends jspb.Message { 
    clearFoundList(): void;
    getFoundList(): Array<KeywordSpottingFound>;
    setFoundList(value: Array<KeywordSpottingFound>): KeywordSpottingResponse;
    addFound(value?: KeywordSpottingFound, index?: number): KeywordSpottingFound;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingResponse.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingResponse): KeywordSpottingResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingResponse;
    static deserializeBinaryFromReader(message: KeywordSpottingResponse, reader: jspb.BinaryReader): KeywordSpottingResponse;
}

export namespace KeywordSpottingResponse {
    export type AsObject = {
        foundList: Array<KeywordSpottingFound.AsObject>,
    }
}
