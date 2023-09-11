// package: AiService
// file: transcription.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as transcription_pb from "./transcription_pb";

interface ITranscriptionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    transcriptionBiStreams: ITranscriptionService_ITranscriptionBiStreams;
}

interface ITranscriptionService_ITranscriptionBiStreams extends grpc.MethodDefinition<transcription_pb.VoiceAudio, transcription_pb.transcribedText> {
    path: "/AiService.Transcription/TranscriptionBiStreams";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<transcription_pb.VoiceAudio>;
    requestDeserialize: grpc.deserialize<transcription_pb.VoiceAudio>;
    responseSerialize: grpc.serialize<transcription_pb.transcribedText>;
    responseDeserialize: grpc.deserialize<transcription_pb.transcribedText>;
}

export const TranscriptionService: ITranscriptionService;

export interface ITranscriptionServer extends grpc.UntypedServiceImplementation {
    transcriptionBiStreams: grpc.handleBidiStreamingCall<transcription_pb.VoiceAudio, transcription_pb.transcribedText>;
}

export interface ITranscriptionClient {
    transcriptionBiStreams(): grpc.ClientDuplexStream<transcription_pb.VoiceAudio, transcription_pb.transcribedText>;
    transcriptionBiStreams(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.VoiceAudio, transcription_pb.transcribedText>;
    transcriptionBiStreams(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.VoiceAudio, transcription_pb.transcribedText>;
}

export class TranscriptionClient extends grpc.Client implements ITranscriptionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public transcriptionBiStreams(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.VoiceAudio, transcription_pb.transcribedText>;
    public transcriptionBiStreams(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<transcription_pb.VoiceAudio, transcription_pb.transcribedText>;
}
