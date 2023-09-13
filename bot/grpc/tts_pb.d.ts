// package: AiService
// file: tts.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

export class TtsSpeakRequest extends jspb.Message { 
    getText(): string;
    setText(value: string): TtsSpeakRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TtsSpeakRequest.AsObject;
    static toObject(includeInstance: boolean, msg: TtsSpeakRequest): TtsSpeakRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TtsSpeakRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TtsSpeakRequest;
    static deserializeBinaryFromReader(message: TtsSpeakRequest, reader: jspb.BinaryReader): TtsSpeakRequest;
}

export namespace TtsSpeakRequest {
    export type AsObject = {
        text: string,
    }
}

export class TtsSpeakResponse extends jspb.Message { 
    getText(): string;
    setText(value: string): TtsSpeakResponse;
    getAudio(): Uint8Array | string;
    getAudio_asU8(): Uint8Array;
    getAudio_asB64(): string;
    setAudio(value: Uint8Array | string): TtsSpeakResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TtsSpeakResponse.AsObject;
    static toObject(includeInstance: boolean, msg: TtsSpeakResponse): TtsSpeakResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TtsSpeakResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TtsSpeakResponse;
    static deserializeBinaryFromReader(message: TtsSpeakResponse, reader: jspb.BinaryReader): TtsSpeakResponse;
}

export namespace TtsSpeakResponse {
    export type AsObject = {
        text: string,
        audio: Uint8Array | string,
    }
}

export class TtsSpeakerInfoList extends jspb.Message { 
    clearSpeakersList(): void;
    getSpeakersList(): Array<TtsSpeakerInfo>;
    setSpeakersList(value: Array<TtsSpeakerInfo>): TtsSpeakerInfoList;
    addSpeakers(value?: TtsSpeakerInfo, index?: number): TtsSpeakerInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TtsSpeakerInfoList.AsObject;
    static toObject(includeInstance: boolean, msg: TtsSpeakerInfoList): TtsSpeakerInfoList.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TtsSpeakerInfoList, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TtsSpeakerInfoList;
    static deserializeBinaryFromReader(message: TtsSpeakerInfoList, reader: jspb.BinaryReader): TtsSpeakerInfoList;
}

export namespace TtsSpeakerInfoList {
    export type AsObject = {
        speakersList: Array<TtsSpeakerInfo.AsObject>,
    }
}

export class TtsSpeakerInfo extends jspb.Message { 
    getIndex(): number;
    setIndex(value: number): TtsSpeakerInfo;
    getName(): string;
    setName(value: string): TtsSpeakerInfo;
    getSelected(): boolean;
    setSelected(value: boolean): TtsSpeakerInfo;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TtsSpeakerInfo.AsObject;
    static toObject(includeInstance: boolean, msg: TtsSpeakerInfo): TtsSpeakerInfo.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TtsSpeakerInfo, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TtsSpeakerInfo;
    static deserializeBinaryFromReader(message: TtsSpeakerInfo, reader: jspb.BinaryReader): TtsSpeakerInfo;
}

export namespace TtsSpeakerInfo {
    export type AsObject = {
        index: number,
        name: string,
        selected: boolean,
    }
}

export class TtsSpeakerSelect extends jspb.Message { 
    getIndex(): number;
    setIndex(value: number): TtsSpeakerSelect;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TtsSpeakerSelect.AsObject;
    static toObject(includeInstance: boolean, msg: TtsSpeakerSelect): TtsSpeakerSelect.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TtsSpeakerSelect, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TtsSpeakerSelect;
    static deserializeBinaryFromReader(message: TtsSpeakerSelect, reader: jspb.BinaryReader): TtsSpeakerSelect;
}

export namespace TtsSpeakerSelect {
    export type AsObject = {
        index: number,
    }
}
