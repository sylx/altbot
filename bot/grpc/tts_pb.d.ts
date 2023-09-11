// package: AiService
// file: tts.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

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
        audio: Uint8Array | string,
    }
}
