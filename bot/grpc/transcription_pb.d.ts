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
    getThreshold(): number;
    setThreshold(value: number): KeywordSpottingRequestConfig;

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
        threshold: number,
    }
}

export class KeywordSpottingRequestAudio extends jspb.Message { 
    clearDataList(): void;
    getDataList(): Array<Uint8Array | string>;
    getDataList_asU8(): Array<Uint8Array>;
    getDataList_asB64(): Array<string>;
    setDataList(value: Array<Uint8Array | string>): KeywordSpottingRequestAudio;
    addData(value: Uint8Array | string, index?: number): Uint8Array | string;
    getSpeakerId(): string;
    setSpeakerId(value: string): KeywordSpottingRequestAudio;
    getTimestamp(): number;
    setTimestamp(value: number): KeywordSpottingRequestAudio;

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
        dataList: Array<Uint8Array | string>,
        speakerId: string,
        timestamp: number,
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
    getIsFinal(): boolean;
    setIsFinal(value: boolean): KeywordSpottingRequest;

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
        isFinal: boolean,
    }

    export enum RequestOneofCase {
        REQUEST_ONEOF_NOT_SET = 0,
        CONFIG = 1,
        AUDIO = 2,
    }

}

export class KeywordSpottingFound extends jspb.Message { 
    getId(): string;
    setId(value: string): KeywordSpottingFound;
    getKeyword(): string;
    setKeyword(value: string): KeywordSpottingFound;
    getProbability(): number;
    setProbability(value: number): KeywordSpottingFound;

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
        id: string,
        keyword: string,
        probability: number,
    }
}

export class KeywordSpottingFoundEventResponse extends jspb.Message { 
    clearFoundList(): void;
    getFoundList(): Array<KeywordSpottingFound>;
    setFoundList(value: Array<KeywordSpottingFound>): KeywordSpottingFoundEventResponse;
    addFound(value?: KeywordSpottingFound, index?: number): KeywordSpottingFound;
    getSpeakerId(): string;
    setSpeakerId(value: string): KeywordSpottingFoundEventResponse;
    getDecoderText(): string;
    setDecoderText(value: string): KeywordSpottingFoundEventResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingFoundEventResponse.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingFoundEventResponse): KeywordSpottingFoundEventResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingFoundEventResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingFoundEventResponse;
    static deserializeBinaryFromReader(message: KeywordSpottingFoundEventResponse, reader: jspb.BinaryReader): KeywordSpottingFoundEventResponse;
}

export namespace KeywordSpottingFoundEventResponse {
    export type AsObject = {
        foundList: Array<KeywordSpottingFound.AsObject>,
        speakerId: string,
        decoderText: string,
    }
}

export class KeywordSpottingConfigResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): KeywordSpottingConfigResponse;
    clearKeywordList(): void;
    getKeywordList(): Array<string>;
    setKeywordList(value: Array<string>): KeywordSpottingConfigResponse;
    addKeyword(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingConfigResponse.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingConfigResponse): KeywordSpottingConfigResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingConfigResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingConfigResponse;
    static deserializeBinaryFromReader(message: KeywordSpottingConfigResponse, reader: jspb.BinaryReader): KeywordSpottingConfigResponse;
}

export namespace KeywordSpottingConfigResponse {
    export type AsObject = {
        success: boolean,
        keywordList: Array<string>,
    }
}

export class KeywordSpottingResponse extends jspb.Message { 

    hasFound(): boolean;
    clearFound(): void;
    getFound(): KeywordSpottingFoundEventResponse | undefined;
    setFound(value?: KeywordSpottingFoundEventResponse): KeywordSpottingResponse;

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): KeywordSpottingConfigResponse | undefined;
    setConfig(value?: KeywordSpottingConfigResponse): KeywordSpottingResponse;

    getResponseOneofCase(): KeywordSpottingResponse.ResponseOneofCase;

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
        found?: KeywordSpottingFoundEventResponse.AsObject,
        config?: KeywordSpottingConfigResponse.AsObject,
    }

    export enum ResponseOneofCase {
        RESPONSE_ONEOF_NOT_SET = 0,
        FOUND = 1,
        CONFIG = 2,
    }

}
