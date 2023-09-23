// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as transcription_pb from "./transcription_pb";

interface ITranscriptionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    transcriptionBiStreams: ITranscriptionService_ITranscriptionBiStreams;
}

interface ITranscriptionService_ITranscriptionBiStreams extends grpc.MethodDefinition<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent> {
    path: "/AiService.Transcription/TranscriptionBiStreams";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<transcription_pb.DiscordOpusPacketList>;
    requestDeserialize: grpc.deserialize<transcription_pb.DiscordOpusPacketList>;
    responseSerialize: grpc.serialize<transcription_pb.TranscriptionEvent>;
    responseDeserialize: grpc.deserialize<transcription_pb.TranscriptionEvent>;
}

export const TranscriptionService: ITranscriptionService;

export interface ITranscriptionServer extends grpc.UntypedServiceImplementation {
    transcriptionBiStreams: grpc.handleBidiStreamingCall<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
}

export interface ITranscriptionClient {
    transcriptionBiStreams(): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    transcriptionBiStreams(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    transcriptionBiStreams(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
}

export class TranscriptionClient extends grpc.Client implements ITranscriptionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public transcriptionBiStreams(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    public transcriptionBiStreams(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
}
