# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: transcription.proto
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x13transcription.proto\x12\tAiService\"H\n\x11\x44iscordOpusPacket\x12\x11\n\ttimestamp\x18\x01 \x01(\x03\x12\x12\n\nspeaker_id\x18\x02 \x01(\t\x12\x0c\n\x04\x64\x61ta\x18\x03 \x01(\x0c\"X\n\x15\x44iscordOpusPacketList\x12-\n\x07packets\x18\x01 \x03(\x0b\x32\x1c.AiService.DiscordOpusPacket\x12\x10\n\x08is_final\x18\x02 \x01(\x08\"i\n\x0fTranscribedText\x12\r\n\x05\x62\x65gin\x18\x01 \x01(\x03\x12\x0b\n\x03\x65nd\x18\x02 \x01(\x03\x12\x18\n\x10packet_timestamp\x18\x03 \x01(\x03\x12\x12\n\nspeaker_id\x18\x04 \x01(\t\x12\x0c\n\x04text\x18\x05 \x01(\t2k\n\rTranscription\x12Z\n\x16TranscriptionBiStreams\x12 .AiService.DiscordOpusPacketList\x1a\x1a.AiService.TranscribedText(\x01\x30\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'transcription_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:

  DESCRIPTOR._options = None
  _globals['_DISCORDOPUSPACKET']._serialized_start=34
  _globals['_DISCORDOPUSPACKET']._serialized_end=106
  _globals['_DISCORDOPUSPACKETLIST']._serialized_start=108
  _globals['_DISCORDOPUSPACKETLIST']._serialized_end=196
  _globals['_TRANSCRIBEDTEXT']._serialized_start=198
  _globals['_TRANSCRIBEDTEXT']._serialized_end=303
  _globals['_TRANSCRIPTION']._serialized_start=305
  _globals['_TRANSCRIPTION']._serialized_end=412
# @@protoc_insertion_point(module_scope)
