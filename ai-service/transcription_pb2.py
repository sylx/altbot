# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: transcription.proto
# Protobuf Python Version: 4.25.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x13transcription.proto\x12\tAiService\"4\n\x11\x44iscordOpusPacket\x12\x11\n\ttimestamp\x18\x01 \x01(\x03\x12\x0c\n\x04\x64\x61ta\x18\x02 \x01(\x0c\"|\n\x15\x44iscordOpusPacketList\x12-\n\x07packets\x18\x01 \x03(\x0b\x32\x1c.AiService.DiscordOpusPacket\x12\x12\n\nspeaker_id\x18\x02 \x01(\t\x12\x0e\n\x06prompt\x18\x03 \x01(\t\x12\x10\n\x08is_final\x18\x04 \x01(\x08\"L\n\x12TranscriptionEvent\x12\x11\n\teventName\x18\x01 \x01(\t\x12\x11\n\teventData\x18\x02 \x01(\t\x12\x10\n\x08opusData\x18\x03 \x01(\x0c\"/\n\x1cKeywordSpottingRequestConfig\x12\x0f\n\x07keyword\x18\x01 \x03(\t\"?\n\x1bKeywordSpottingRequestAudio\x12\x0c\n\x04\x64\x61ta\x18\x01 \x01(\x0c\x12\x12\n\nspeaker_id\x18\x02 \x01(\t\"\x9d\x01\n\x16KeywordSpottingRequest\x12\x39\n\x06\x63onfig\x18\x01 \x01(\x0b\x32\'.AiService.KeywordSpottingRequestConfigH\x00\x12\x37\n\x05\x61udio\x18\x02 \x01(\x0b\x32&.AiService.KeywordSpottingRequestAudioH\x00\x42\x0f\n\rrequest_oneof\"P\n\x14KeywordSpottingFound\x12\x0f\n\x07keyword\x18\x01 \x01(\t\x12\x13\n\x0bprobability\x18\x02 \x01(\x02\x12\x12\n\nspeaker_id\x18\x03 \x01(\t\"I\n\x17KeywordSpottingResponse\x12.\n\x05\x66ound\x18\x01 \x03(\x0b\x32\x1f.AiService.KeywordSpottingFound2\xc9\x01\n\rTranscription\x12]\n\x16TranscriptionBiStreams\x12 .AiService.DiscordOpusPacketList\x1a\x1d.AiService.TranscriptionEvent(\x01\x30\x01\x12Y\n\x0fKeywordSpotting\x12!.AiService.KeywordSpottingRequest\x1a\x1f.AiService.KeywordSpottingFound(\x01\x30\x01\x62\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'transcription_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  DESCRIPTOR._options = None
  _globals['_DISCORDOPUSPACKET']._serialized_start=34
  _globals['_DISCORDOPUSPACKET']._serialized_end=86
  _globals['_DISCORDOPUSPACKETLIST']._serialized_start=88
  _globals['_DISCORDOPUSPACKETLIST']._serialized_end=212
  _globals['_TRANSCRIPTIONEVENT']._serialized_start=214
  _globals['_TRANSCRIPTIONEVENT']._serialized_end=290
  _globals['_KEYWORDSPOTTINGREQUESTCONFIG']._serialized_start=292
  _globals['_KEYWORDSPOTTINGREQUESTCONFIG']._serialized_end=339
  _globals['_KEYWORDSPOTTINGREQUESTAUDIO']._serialized_start=341
  _globals['_KEYWORDSPOTTINGREQUESTAUDIO']._serialized_end=404
  _globals['_KEYWORDSPOTTINGREQUEST']._serialized_start=407
  _globals['_KEYWORDSPOTTINGREQUEST']._serialized_end=564
  _globals['_KEYWORDSPOTTINGFOUND']._serialized_start=566
  _globals['_KEYWORDSPOTTINGFOUND']._serialized_end=646
  _globals['_KEYWORDSPOTTINGRESPONSE']._serialized_start=648
  _globals['_KEYWORDSPOTTINGRESPONSE']._serialized_end=721
  _globals['_TRANSCRIPTION']._serialized_start=724
  _globals['_TRANSCRIPTION']._serialized_end=925
# @@protoc_insertion_point(module_scope)
