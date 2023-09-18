// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var transcription_pb = require('./transcription_pb.js');

function serialize_AiService_DiscordOpusPacketList(arg) {
  if (!(arg instanceof transcription_pb.DiscordOpusPacketList)) {
    throw new Error('Expected argument of type AiService.DiscordOpusPacketList');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_DiscordOpusPacketList(buffer_arg) {
  return transcription_pb.DiscordOpusPacketList.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AiService_TranscribedText(arg) {
  if (!(arg instanceof transcription_pb.TranscribedText)) {
    throw new Error('Expected argument of type AiService.TranscribedText');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TranscribedText(buffer_arg) {
  return transcription_pb.TranscribedText.deserializeBinary(new Uint8Array(buffer_arg));
}


var TranscriptionService = exports.TranscriptionService = {
  transcriptionBiStreams: {
    path: '/AiService.Transcription/TranscriptionBiStreams',
    requestStream: true,
    responseStream: true,
    requestType: transcription_pb.DiscordOpusPacketList,
    responseType: transcription_pb.TranscribedText,
    requestSerialize: serialize_AiService_DiscordOpusPacketList,
    requestDeserialize: deserialize_AiService_DiscordOpusPacketList,
    responseSerialize: serialize_AiService_TranscribedText,
    responseDeserialize: deserialize_AiService_TranscribedText,
  },
};

exports.TranscriptionClient = grpc.makeGenericClientConstructor(TranscriptionService);
