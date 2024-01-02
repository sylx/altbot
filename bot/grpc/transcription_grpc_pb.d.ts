// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as transcription_pb from "./transcription_pb";

interface ITranscriptionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    transcription: ITranscriptionService_ITranscription;
    keywordSpotting: ITranscriptionService_IKeywordSpotting;
}

interface ITranscriptionService_ITranscription extends grpc.MethodDefinition<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse> {
    path: "/AiService.Transcription/Transcription";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<transcription_pb.TranscriptionRequest>;
    requestDeserialize: grpc.deserialize<transcription_pb.TranscriptionRequest>;
    responseSerialize: grpc.serialize<transcription_pb.TranscriptionResponse>;
    responseDeserialize: grpc.deserialize<transcription_pb.TranscriptionResponse>;
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
    transcription: grpc.handleBidiStreamingCall<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse>;
    keywordSpotting: grpc.handleBidiStreamingCall<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
}

export interface ITranscriptionClient {
    transcription(): grpc.ClientDuplexStream<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse>;
    transcription(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse>;
    transcription(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse>;
    keywordSpotting(): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
    keywordSpotting(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
    keywordSpotting(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
}

export class TranscriptionClient extends grpc.Client implements ITranscriptionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public transcription(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse>;
    public transcription(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.TranscriptionRequest, transcription_pb.TranscriptionResponse>;
    public keywordSpotting(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
    public keywordSpotting(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.KeywordSpottingRequest, transcription_pb.KeywordSpottingResponse>;
}
