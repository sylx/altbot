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

function serialize_AiService_TranscriptionEvent(arg) {
  if (!(arg instanceof transcription_pb.TranscriptionEvent)) {
    throw new Error('Expected argument of type AiService.TranscriptionEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TranscriptionEvent(buffer_arg) {
  return transcription_pb.TranscriptionEvent.deserializeBinary(new Uint8Array(buffer_arg));
}


var TranscriptionService = exports.TranscriptionService = {
  transcriptionBiStreams: {
    path: '/AiService.Transcription/TranscriptionBiStreams',
    requestStream: true,
    responseStream: true,
    requestType: transcription_pb.DiscordOpusPacketList,
    responseType: transcription_pb.TranscriptionEvent,
    requestSerialize: serialize_AiService_DiscordOpusPacketList,
    requestDeserialize: deserialize_AiService_DiscordOpusPacketList,
    responseSerialize: serialize_AiService_TranscriptionEvent,
    responseDeserialize: deserialize_AiService_TranscriptionEvent,
  },
};

exports.TranscriptionClient = grpc.makeGenericClientConstructor(TranscriptionService);
