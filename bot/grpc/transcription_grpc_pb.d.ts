// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as transcription_pb from "./transcription_pb";

interface ITranscriptionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    transcriptionBiStreams: ITranscriptionService_ITranscriptionBiStreams;
    keywordSpotting: ITranscriptionService_IKeywordSpotting;
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
interface ITranscriptionService_IKeywordSpotting extends grpc.MethodDefinition<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse> {
    path: "/AiService.Transcription/KeywordSpotting";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<transcription_pb.KeywordSpottingRequest>;
    requestDeserialize: grpc.deserialize<transcription_pb.KeywordSpottingRequest>;
    responseSerialize: grpc.serialize<transcription_pb.KeywordSpottingResponse>;
    responseDeserialize: grpc.deserialize<transcription_pb.KeywordSpottingResponse>;
}

export const TranscriptionService: ITranscriptionService;

export interface ITranscriptionServer extends grpc.UntypedServiceImplementation {
    transcriptionBiStreams: grpc.handleBidiStreamingCall<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    keywordSpotting: grpc.handleBidiStreamingCall<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
}

export interface ITranscriptionClient {
    transcriptionBiStreams(): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    transcriptionBiStreams(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    transcriptionBiStreams(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    keywordSpotting(): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
    keywordSpotting(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
    keywordSpotting(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
}

export class TranscriptionClient extends grpc.Client implements ITranscriptionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public transcriptionBiStreams(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    public transcriptionBiStreams(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.DiscordOpusPacketList, transcription_pb.TranscriptionEvent>;
    public keywordSpotting(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
    public keywordSpotting(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
}
