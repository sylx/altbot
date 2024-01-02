// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var transcription_pb = require('./transcription_pb.js');

function serialize_AiService_KeywordSpottingRequest(arg) {
  if (!(arg instanceof transcription_pb.KeywordSpottingRequest)) {
    throw new Error('Expected argument of type AiService.KeywordSpottingRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_KeywordSpottingRequest(buffer_arg) {
  return transcription_pb.KeywordSpottingRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AiService_KeywordSpottingResponse(arg) {
  if (!(arg instanceof transcription_pb.KeywordSpottingResponse)) {
    throw new Error('Expected argument of type AiService.KeywordSpottingResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_KeywordSpottingResponse(buffer_arg) {
  return transcription_pb.KeywordSpottingResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AiService_TranscriptionRequest(arg) {
  if (!(arg instanceof transcription_pb.TranscriptionRequest)) {
    throw new Error('Expected argument of type AiService.TranscriptionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TranscriptionRequest(buffer_arg) {
  return transcription_pb.TranscriptionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AiService_TranscriptionResponse(arg) {
  if (!(arg instanceof transcription_pb.TranscriptionResponse)) {
    throw new Error('Expected argument of type AiService.TranscriptionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AiService_TranscriptionResponse(buffer_arg) {
  return transcription_pb.TranscriptionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var TranscriptionService = exports.TranscriptionService = {
  transcription: {
    path: '/AiService.Transcription/Transcription',
    requestStream: true,
    responseStream: true,
    requestType: transcription_pb.TranscriptionRequest,
    responseType: transcription_pb.TranscriptionResponse,
    requestSerialize: serialize_AiService_TranscriptionRequest,
    requestDeserialize: deserialize_AiService_TranscriptionRequest,
    responseSerialize: serialize_AiService_TranscriptionResponse,
    responseDeserialize: deserialize_AiService_TranscriptionResponse,
  },
  keywordSpotting: {
    path: '/AiService.Transcription/KeywordSpotting',
    requestStream: true,
    responseStream: true,
    requestType: transcription_pb.KeywordSpottingRequest,
    responseType: transcription_pb.KeywordSpottingResponse,
    requestSerialize: serialize_AiService_KeywordSpottingRequest,
    requestDeserialize: deserialize_AiService_KeywordSpottingRequest,
    responseSerialize: serialize_AiService_KeywordSpottingResponse,
    responseDeserialize: deserialize_AiService_KeywordSpottingResponse,
  },
};

exports.TranscriptionClient = grpc.makeGenericClientConstructor(TranscriptionService);
