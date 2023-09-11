// package: AiService
// file: tts.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as tts_pb from "./tts_pb";

interface ITtsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    speakStream: ITtsService_ISpeakStream;
}

interface ITtsService_ISpeakStream extends grpc.MethodDefinition<tts_pb.TtsSpeakRequest, tts_pb.TtsSpeakResponse> {
    path: "/AiService.Tts/SpeakStream";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<tts_pb.TtsSpeakRequest>;
    requestDeserialize: grpc.deserialize<tts_pb.TtsSpeakRequest>;
    responseSerialize: grpc.serialize<tts_pb.TtsSpeakResponse>;
    responseDeserialize: grpc.deserialize<tts_pb.TtsSpeakResponse>;
}

export const TtsService: ITtsService;

export interface ITtsServer extends grpc.UntypedServiceImplementation {
    speakStream: grpc.handleServerStreamingCall<tts_pb.TtsSpeakRequest, tts_pb.TtsSpeakResponse>;
}

export interface ITtsClient {
    speakStream(request: tts_pb.TtsSpeakRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
    speakStream(request: tts_pb.TtsSpeakRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
}

export class TtsClient extends grpc.Client implements ITtsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public speakStream(request: tts_pb.TtsSpeakRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
    public speakStream(request: tts_pb.TtsSpeakRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
}
