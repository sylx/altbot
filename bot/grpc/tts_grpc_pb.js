// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var tts_pb = require('./tts_pb.js');

function serialize_AiService_TtsSpeakRequest(arg) {
  if (!(arg instanceof tts_pb.TtsSpeakRequest)) {
    throw new Error('Expected argument of type AiService.TtsSpeakRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TtsSpeakRequest(buffer_arg) {
  return tts_pb.TtsSpeakRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AiService_TtsSpeakResponse(arg) {
  if (!(arg instanceof tts_pb.TtsSpeakResponse)) {
    throw new Error('Expected argument of type AiService.TtsSpeakResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TtsSpeakResponse(buffer_arg) {
  return tts_pb.TtsSpeakResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var TtsService = exports.TtsService = {
  speakStream: {
    path: '/AiService.Tts/SpeakStream',
    requestStream: false,
    responseStream: true,
    requestType: tts_pb.TtsSpeakRequest,
    responseType: tts_pb.TtsSpeakResponse,
    requestSerialize: serialize_AiService_TtsSpeakRequest,
    requestDeserialize: deserialize_AiService_TtsSpeakRequest,
    responseSerialize: serialize_AiService_TtsSpeakResponse,
    responseDeserialize: deserialize_AiService_TtsSpeakResponse,
  },
};

exports.TtsClient = grpc.makeGenericClientConstructor(TtsService);
