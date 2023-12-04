// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var tts_pb = require('./tts_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

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

function serialize_AiService_TtsSpeakerInfoList(arg) {
  if (!(arg instanceof tts_pb.TtsSpeakerInfoList)) {
    throw new Error('Expected argument of type AiService.TtsSpeakerInfoList');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TtsSpeakerInfoList(buffer_arg) {
  return tts_pb.TtsSpeakerInfoList.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
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
  getSpeakers: {
    path: '/AiService.Tts/GetSpeakers',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: tts_pb.TtsSpeakerInfoList,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_AiService_TtsSpeakerInfoList,
    responseDeserialize: deserialize_AiService_TtsSpeakerInfoList,
  },
};

exports.TtsClient = grpc.makeGenericClientConstructor(TtsService);
