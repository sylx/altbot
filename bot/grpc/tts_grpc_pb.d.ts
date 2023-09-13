// package: AiService
// file: tts.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as tts_pb from "./tts_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

interface ITtsService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    speakStream: ITtsService_ISpeakStream;
    getSpeakers: ITtsService_IGetSpeakers;
    setSpeaker: ITtsService_ISetSpeaker;
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
interface ITtsService_IGetSpeakers extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, tts_pb.TtsSpeakerInfoList> {
    path: "/AiService.Tts/GetSpeakers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<tts_pb.TtsSpeakerInfoList>;
    responseDeserialize: grpc.deserialize<tts_pb.TtsSpeakerInfoList>;
}
interface ITtsService_ISetSpeaker extends grpc.MethodDefinition<tts_pb.TtsSpeakerSelect, tts_pb.TtsSpeakerInfo> {
    path: "/AiService.Tts/SetSpeaker";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<tts_pb.TtsSpeakerSelect>;
    requestDeserialize: grpc.deserialize<tts_pb.TtsSpeakerSelect>;
    responseSerialize: grpc.serialize<tts_pb.TtsSpeakerInfo>;
    responseDeserialize: grpc.deserialize<tts_pb.TtsSpeakerInfo>;
}

export const TtsService: ITtsService;

export interface ITtsServer extends grpc.UntypedServiceImplementation {
    speakStream: grpc.handleServerStreamingCall<tts_pb.TtsSpeakRequest, tts_pb.TtsSpeakResponse>;
    getSpeakers: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, tts_pb.TtsSpeakerInfoList>;
    setSpeaker: grpc.handleUnaryCall<tts_pb.TtsSpeakerSelect, tts_pb.TtsSpeakerInfo>;
}

export interface ITtsClient {
    speakStream(request: tts_pb.TtsSpeakRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
    speakStream(request: tts_pb.TtsSpeakRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
    getSpeakers(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfoList) => void): grpc.ClientUnaryCall;
    getSpeakers(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfoList) => void): grpc.ClientUnaryCall;
    getSpeakers(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfoList) => void): grpc.ClientUnaryCall;
    setSpeaker(request: tts_pb.TtsSpeakerSelect, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfo) => void): grpc.ClientUnaryCall;
    setSpeaker(request: tts_pb.TtsSpeakerSelect, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfo) => void): grpc.ClientUnaryCall;
    setSpeaker(request: tts_pb.TtsSpeakerSelect, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfo) => void): grpc.ClientUnaryCall;
}

export class TtsClient extends grpc.Client implements ITtsClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public speakStream(request: tts_pb.TtsSpeakRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
    public speakStream(request: tts_pb.TtsSpeakRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<tts_pb.TtsSpeakResponse>;
    public getSpeakers(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfoList) => void): grpc.ClientUnaryCall;
    public getSpeakers(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfoList) => void): grpc.ClientUnaryCall;
    public getSpeakers(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfoList) => void): grpc.ClientUnaryCall;
    public setSpeaker(request: tts_pb.TtsSpeakerSelect, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfo) => void): grpc.ClientUnaryCall;
    public setSpeaker(request: tts_pb.TtsSpeakerSelect, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfo) => void): grpc.ClientUnaryCall;
    public setSpeaker(request: tts_pb.TtsSpeakerSelect, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: tts_pb.TtsSpeakerInfo) => void): grpc.ClientUnaryCall;
}
