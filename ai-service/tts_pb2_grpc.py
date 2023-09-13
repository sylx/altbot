# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import tts_pb2 as tts__pb2


class TtsStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.SpeakStream = channel.unary_stream(
                '/AiService.Tts/SpeakStream',
                request_serializer=tts__pb2.TtsSpeakRequest.SerializeToString,
                response_deserializer=tts__pb2.TtsSpeakResponse.FromString,
                )


class TtsServicer(object):
    """Missing associated documentation comment in .proto file."""

    def SpeakStream(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_TtsServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'SpeakStream': grpc.unary_stream_rpc_method_handler(
                    servicer.SpeakStream,
                    request_deserializer=tts__pb2.TtsSpeakRequest.FromString,
                    response_serializer=tts__pb2.TtsSpeakResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'AiService.Tts', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class Tts(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def SpeakStream(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_stream(request, target, '/AiService.Tts/SpeakStream',
            tts__pb2.TtsSpeakRequest.SerializeToString,
            tts__pb2.TtsSpeakResponse.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
