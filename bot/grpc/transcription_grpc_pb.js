// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var transcription_pb = require('./transcription_pb.js');

function serialize_AiService_VoiceAudio(arg) {
  if (!(arg instanceof transcription_pb.VoiceAudio)) {
    throw new Error('Expected argument of type AiService.VoiceAudio');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_VoiceAudio(buffer_arg) {
  return transcription_pb.VoiceAudio.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AiService_transcribedText(arg) {
  if (!(arg instanceof transcription_pb.transcribedText)) {
    throw new Error('Expected argument of type AiService.transcribedText');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_transcribedText(buffer_arg) {
  return transcription_pb.transcribedText.deserializeBinary(new Uint8Array(buffer_arg));
}


var TranscriptionService = exports.TranscriptionService = {
  transcriptionBiStreams: {
    path: '/AiService.Transcription/TranscriptionBiStreams',
    requestStream: true,
    responseStream: true,
    requestType: transcription_pb.VoiceAudio,
    responseType: transcription_pb.transcribedText,
    requestSerialize: serialize_AiService_VoiceAudio,
    requestDeserialize: deserialize_AiService_VoiceAudio,
    responseSerialize: serialize_AiService_transcribedText,
    responseDeserialize: deserialize_AiService_transcribedText,
  },
};

exports.TranscriptionClient = grpc.makeGenericClientConstructor(TranscriptionService);
