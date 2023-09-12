// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class VoiceAudio extends jspb.Message { 
    getSpeakerId(): string;
    setSpeakerId(value: string): VoiceAudio;
    getAudio(): Uint8Array | string;
    getAudio_asU8(): Uint8Array;
    getAudio_asB64(): string;
    setAudio(value: Uint8Array | string): VoiceAudio;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VoiceAudio.AsObject;
    static toObject(includeInstance: boolean, msg: VoiceAudio): VoiceAudio.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VoiceAudio, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VoiceAudio;
    static deserializeBinaryFromReader(message: VoiceAudio, reader: jspb.BinaryReader): VoiceAudio;
}

export namespace VoiceAudio {
    export type AsObject = {
        speakerId: string,
        audio: Uint8Array | string,
    }
}

export class transcribedText extends jspb.Message { 
    getBegin(): number;
    setBegin(value: number): transcribedText;
    getEnd(): number;
    setEnd(value: number): transcribedText;
    getSpeakerId(): string;
    setSpeakerId(value: string): transcribedText;
    getText(): string;
    setText(value: string): transcribedText;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): transcribedText.AsObject;
    static toObject(includeInstance: boolean, msg: transcribedText): transcribedText.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: transcribedText, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): transcribedText;
    static deserializeBinaryFromReader(message: transcribedText, reader: jspb.BinaryReader): transcribedText;
}

export namespace transcribedText {
    export type AsObject = {
        begin: number,
        end: number,
        speakerId: string,
        text: string,
    }
}
