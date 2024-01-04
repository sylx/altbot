// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class TranscriptionRequest extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): TranscriptionConfigRequest | undefined;
    setConfig(value?: TranscriptionConfigRequest): TranscriptionRequest;

    hasAudio(): boolean;
    clearAudio(): void;
    getAudio(): TranscriptionAudioRequest | undefined;
    setAudio(value?: TranscriptionAudioRequest): TranscriptionRequest;

    hasClose(): boolean;
    clearClose(): void;
    getClose(): TranscriptionCloseRequest | undefined;
    setClose(value?: TranscriptionCloseRequest): TranscriptionRequest;

    getRequestOneofCase(): TranscriptionRequest.RequestOneofCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionRequest): TranscriptionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionRequest;
    static deserializeBinaryFromReader(message: TranscriptionRequest, reader: jspb.BinaryReader): TranscriptionRequest;
}

export namespace TranscriptionRequest {
    export type AsObject = {
        config?: TranscriptionConfigRequest.AsObject,
        audio?: TranscriptionAudioRequest.AsObject,
        close?: TranscriptionCloseRequest.AsObject,
    }

    export enum RequestOneofCase {
        REQUEST_ONEOF_NOT_SET = 0,
        CONFIG = 1,
        AUDIO = 2,
        CLOSE = 3,
    }

}

export class TranscriptionConfigRequest extends jspb.Message { 
    getPrompt(): string;
    setPrompt(value: string): TranscriptionConfigRequest;

    hasKwsConfig(): boolean;
    clearKwsConfig(): void;
    getKwsConfig(): KeywordSpottingConfigRequest | undefined;
    setKwsConfig(value?: KeywordSpottingConfigRequest): TranscriptionConfigRequest;
    getReturnOpus(): boolean;
    setReturnOpus(value: boolean): TranscriptionConfigRequest;
    getReturnWords(): boolean;
    setReturnWords(value: boolean): TranscriptionConfigRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionConfigRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionConfigRequest): TranscriptionConfigRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionConfigRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionConfigRequest;
    static deserializeBinaryFromReader(message: TranscriptionConfigRequest, reader: jspb.BinaryReader): TranscriptionConfigRequest;
}

export namespace TranscriptionConfigRequest {
    export type AsObject = {
        prompt: string,
        kwsConfig?: KeywordSpottingConfigRequest.AsObject,
        returnOpus: boolean,
        returnWords: boolean,
    }
}

export class TranscriptionAudioRequest extends jspb.Message { 
    clearDataList(): void;
    getDataList(): Array<Uint8Array | string>;
    getDataList_asU8(): Array<Uint8Array>;
    getDataList_asB64(): Array<string>;
    setDataList(value: Array<Uint8Array | string>): TranscriptionAudioRequest;
    addData(value: Uint8Array | string, index?: number): Uint8Array | string;
    getSpeakerId(): string;
    setSpeakerId(value: string): TranscriptionAudioRequest;
    getForceFlush(): boolean;
    setForceFlush(value: boolean): TranscriptionAudioRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionAudioRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionAudioRequest): TranscriptionAudioRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionAudioRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionAudioRequest;
    static deserializeBinaryFromReader(message: TranscriptionAudioRequest, reader: jspb.BinaryReader): TranscriptionAudioRequest;
}

export namespace TranscriptionAudioRequest {
    export type AsObject = {
        dataList: Array<Uint8Array | string>,
        speakerId: string,
        forceFlush: boolean,
    }
}

export class TranscriptionCloseRequest extends jspb.Message { 
    getIsAbort(): boolean;
    setIsAbort(value: boolean): TranscriptionCloseRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionCloseRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionCloseRequest): TranscriptionCloseRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionCloseRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionCloseRequest;
    static deserializeBinaryFromReader(message: TranscriptionCloseRequest, reader: jspb.BinaryReader): TranscriptionCloseRequest;
}

export namespace TranscriptionCloseRequest {
    export type AsObject = {
        isAbort: boolean,
    }
}

export class TranscriptionResponse extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): TranscriptionConfigResponse | undefined;
    setConfig(value?: TranscriptionConfigResponse): TranscriptionResponse;

    hasEvent(): boolean;
    clearEvent(): void;
    getEvent(): TranscriptionEventResponse | undefined;
    setEvent(value?: TranscriptionEventResponse): TranscriptionResponse;

    hasClose(): boolean;
    clearClose(): void;
    getClose(): TranscriptionCloseResponse | undefined;
    setClose(value?: TranscriptionCloseResponse): TranscriptionResponse;

    getResponseOneofCase(): TranscriptionResponse.ResponseOneofCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionResponse): TranscriptionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionResponse;
    static deserializeBinaryFromReader(message: TranscriptionResponse, reader: jspb.BinaryReader): TranscriptionResponse;
}

export namespace TranscriptionResponse {
    export type AsObject = {
        config?: TranscriptionConfigResponse.AsObject,
        event?: TranscriptionEventResponse.AsObject,
        close?: TranscriptionCloseResponse.AsObject,
    }

    export enum ResponseOneofCase {
        RESPONSE_ONEOF_NOT_SET = 0,
        CONFIG = 1,
        EVENT = 2,
        CLOSE = 3,
    }

}

export class TranscriptionConfigResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): TranscriptionConfigResponse;
    getPrompt(): string;
    setPrompt(value: string): TranscriptionConfigResponse;

    hasKwsConfig(): boolean;
    clearKwsConfig(): void;
    getKwsConfig(): KeywordSpottingConfigResponse | undefined;
    setKwsConfig(value?: KeywordSpottingConfigResponse): TranscriptionConfigResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionConfigResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionConfigResponse): TranscriptionConfigResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionConfigResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionConfigResponse;
    static deserializeBinaryFromReader(message: TranscriptionConfigResponse, reader: jspb.BinaryReader): TranscriptionConfigResponse;
}

export namespace TranscriptionConfigResponse {
    export type AsObject = {
        success: boolean,
        prompt: string,
        kwsConfig?: KeywordSpottingConfigResponse.AsObject,
    }
}

export class TranscriptionEventResponse extends jspb.Message { 
    getText(): string;
    setText(value: string): TranscriptionEventResponse;
    clearWordsList(): void;
    getWordsList(): Array<TranscriptionEventWord>;
    setWordsList(value: Array<TranscriptionEventWord>): TranscriptionEventResponse;
    addWords(value?: TranscriptionEventWord, index?: number): TranscriptionEventWord;
    getTimestamp(): number;
    setTimestamp(value: number): TranscriptionEventResponse;
    getSpeakerId(): string;
    setSpeakerId(value: string): TranscriptionEventResponse;
    getProbability(): number;
    setProbability(value: number): TranscriptionEventResponse;
    getOpusdata(): Uint8Array | string;
    getOpusdata_asU8(): Uint8Array;
    getOpusdata_asB64(): string;
    setOpusdata(value: Uint8Array | string): TranscriptionEventResponse;
    getInfo(): string;
    setInfo(value: string): TranscriptionEventResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionEventResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionEventResponse): TranscriptionEventResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionEventResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionEventResponse;
    static deserializeBinaryFromReader(message: TranscriptionEventResponse, reader: jspb.BinaryReader): TranscriptionEventResponse;
}

export namespace TranscriptionEventResponse {
    export type AsObject = {
        text: string,
        wordsList: Array<TranscriptionEventWord.AsObject>,
        timestamp: number,
        speakerId: string,
        probability: number,
        opusdata: Uint8Array | string,
        info: string,
    }
}

export class TranscriptionEventWord extends jspb.Message { 
    getWord(): string;
    setWord(value: string): TranscriptionEventWord;
    getProbability(): number;
    setProbability(value: number): TranscriptionEventWord;
    getTimestamp(): number;
    setTimestamp(value: number): TranscriptionEventWord;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionEventWord.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionEventWord): TranscriptionEventWord.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionEventWord, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionEventWord;
    static deserializeBinaryFromReader(message: TranscriptionEventWord, reader: jspb.BinaryReader): TranscriptionEventWord;
}

export namespace TranscriptionEventWord {
    export type AsObject = {
        word: string,
        probability: number,
        timestamp: number,
    }
}

export class TranscriptionCloseResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): TranscriptionCloseResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TranscriptionCloseResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TranscriptionCloseResponse): TranscriptionCloseResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TranscriptionCloseResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TranscriptionCloseResponse;
    static deserializeBinaryFromReader(message: TranscriptionCloseResponse, reader: jspb.BinaryReader): TranscriptionCloseResponse;
}

export namespace TranscriptionCloseResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class KeywordSpottingRequest extends jspb.Message { 

    hasConfig(): boolean;
    clearConfig(): void;
    getConfig(): KeywordSpottingConfigRequest | undefined;
    setConfig(value?: KeywordSpottingConfigRequest): KeywordSpottingRequest;

    hasAudio(): boolean;
    clearAudio(): void;
    getAudio(): KeywordSpottingAudioRequest | undefined;
    setAudio(value?: KeywordSpottingAudioRequest): KeywordSpottingRequest;
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
        config?: KeywordSpottingConfigRequest.AsObject,
        audio?: KeywordSpottingAudioRequest.AsObject,
        isFinal: boolean,
    }

    export enum RequestOneofCase {
        REQUEST_ONEOF_NOT_SET = 0,
        CONFIG = 1,
        AUDIO = 2,
    }

}

export class KeywordSpottingConfigRequest extends jspb.Message { 
    clearKeywordList(): void;
    getKeywordList(): Array<string>;
    setKeywordList(value: Array<string>): KeywordSpottingConfigRequest;
    addKeyword(value: string, index?: number): string;
    getThreshold(): number;
    setThreshold(value: number): KeywordSpottingConfigRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingConfigRequest.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingConfigRequest): KeywordSpottingConfigRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingConfigRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingConfigRequest;
    static deserializeBinaryFromReader(message: KeywordSpottingConfigRequest, reader: jspb.BinaryReader): KeywordSpottingConfigRequest;
}

export namespace KeywordSpottingConfigRequest {
    export type AsObject = {
        keywordList: Array<string>,
        threshold: number,
    }
}

export class KeywordSpottingAudioRequest extends jspb.Message { 
    clearDataList(): void;
    getDataList(): Array<Uint8Array | string>;
    getDataList_asU8(): Array<Uint8Array>;
    getDataList_asB64(): Array<string>;
    setDataList(value: Array<Uint8Array | string>): KeywordSpottingAudioRequest;
    addData(value: Uint8Array | string, index?: number): Uint8Array | string;
    getSpeakerId(): string;
    setSpeakerId(value: string): KeywordSpottingAudioRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeywordSpottingAudioRequest.AsObject;
    static toObject(includeInstance: boolean, msg: KeywordSpottingAudioRequest): KeywordSpottingAudioRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeywordSpottingAudioRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeywordSpottingAudioRequest;
    static deserializeBinaryFromReader(message: KeywordSpottingAudioRequest, reader: jspb.BinaryReader): KeywordSpottingAudioRequest;
}

export namespace KeywordSpottingAudioRequest {
    export type AsObject = {
        dataList: Array<Uint8Array | string>,
        speakerId: string,
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
