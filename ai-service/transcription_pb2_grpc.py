# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import transcription_pb2 as transcription__pb2


class TranscriptionStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Transcription = channel.stream_stream(
                '/AiService.Transcription/Transcription',
                request_serializer=transcription__pb2.TranscriptionRequest.SerializeToString,
                response_deserializer=transcription__pb2.TranscriptionResponse.FromString,
                )
        self.KeywordSpotting = channel.stream_stream(
                '/AiService.Transcription/KeywordSpotting',
                request_serializer=transcription__pb2.KeywordSpottingRequest.SerializeToString,
                response_deserializer=transcription__pb2.KeywordSpottingResponse.FromString,
                )


class TranscriptionServicer(object):
    """Missing associated documentation comment in .proto file."""

    def Transcription(self, request_iterator, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def KeywordSpotting(self, request_iterator, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_TranscriptionServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'Transcription': grpc.stream_stream_rpc_method_handler(
                    servicer.Transcription,
                    request_deserializer=transcription__pb2.TranscriptionRequest.FromString,
                    response_serializer=transcription__pb2.TranscriptionResponse.SerializeToString,
            ),
            'KeywordSpotting': grpc.stream_stream_rpc_method_handler(
                    servicer.KeywordSpotting,
                    request_deserializer=transcription__pb2.KeywordSpottingRequest.FromString,
                    response_serializer=transcription__pb2.KeywordSpottingResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'AiService.Transcription', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class Transcription(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def Transcription(request_iterator,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.stream_stream(request_iterator, target, '/AiService.Transcription/Transcription',
            transcription__pb2.TranscriptionRequest.SerializeToString,
            transcription__pb2.TranscriptionResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def KeywordSpotting(request_iterator,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.stream_stream(request_iterator, target, '/AiService.Transcription/KeywordSpotting',
            transcription__pb2.KeywordSpottingRequest.SerializeToString,
            transcription__pb2.KeywordSpottingResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
