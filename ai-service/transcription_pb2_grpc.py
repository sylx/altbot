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
        self.TranscriptionBiStreams = channel.stream_stream(
                '/AiService.Transcription/TranscriptionBiStreams',
                request_serializer=transcription__pb2.DiscordOpusPacketList.SerializeToString,
                response_deserializer=transcription__pb2.TranscribedText.FromString,
                )


class TranscriptionServicer(object):
    """Missing associated documentation comment in .proto file."""

    def TranscriptionBiStreams(self, request_iterator, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_TranscriptionServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'TranscriptionBiStreams': grpc.stream_stream_rpc_method_handler(
                    servicer.TranscriptionBiStreams,
                    request_deserializer=transcription__pb2.DiscordOpusPacketList.FromString,
                    response_serializer=transcription__pb2.TranscribedText.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'AiService.Transcription', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class Transcription(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def TranscriptionBiStreams(request_iterator,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.stream_stream(request_iterator, target, '/AiService.Transcription/TranscriptionBiStreams',
            transcription__pb2.DiscordOpusPacketList.SerializeToString,
            transcription__pb2.TranscribedText.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)
