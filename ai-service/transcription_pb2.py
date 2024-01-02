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




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x13transcription.proto\x12\tAiService\"4\n\x11\x44iscordOpusPacket\x12\x11\n\ttimestamp\x18\x01 \x01(\x03\x12\x0c\n\x04\x64\x61ta\x18\x02 \x01(\x0c\"|\n\x15\x44iscordOpusPacketList\x12-\n\x07packets\x18\x01 \x03(\x0b\x32\x1c.AiService.DiscordOpusPacket\x12\x12\n\nspeaker_id\x18\x02 \x01(\t\x12\x0e\n\x06prompt\x18\x03 \x01(\t\x12\x10\n\x08is_final\x18\x04 \x01(\x08\"L\n\x12TranscriptionEvent\x12\x11\n\teventName\x18\x01 \x01(\t\x12\x11\n\teventData\x18\x02 \x01(\t\x12\x10\n\x08opusData\x18\x03 \x01(\x0c\"B\n\x1cKeywordSpottingRequestConfig\x12\x0f\n\x07keyword\x18\x01 \x03(\t\x12\x11\n\tthreshold\x18\x02 \x01(\x02\"R\n\x1bKeywordSpottingRequestAudio\x12\x0c\n\x04\x64\x61ta\x18\x01 \x03(\x0c\x12\x12\n\nspeaker_id\x18\x02 \x01(\t\x12\x11\n\ttimestamp\x18\x03 \x01(\x03\"\xaf\x01\n\x16KeywordSpottingRequest\x12\x39\n\x06\x63onfig\x18\x01 \x01(\x0b\x32\'.AiService.KeywordSpottingRequestConfigH\x00\x12\x37\n\x05\x61udio\x18\x02 \x01(\x0b\x32&.AiService.KeywordSpottingRequestAudioH\x00\x12\x10\n\x08is_final\x18\x03 \x01(\x08\x42\x0f\n\rrequest_oneof\"H\n\x14KeywordSpottingFound\x12\n\n\x02id\x18\x01 \x01(\t\x12\x0f\n\x07keyword\x18\x02 \x01(\t\x12\x13\n\x0bprobability\x18\x03 \x01(\x02\"}\n!KeywordSpottingFoundEventResponse\x12.\n\x05\x66ound\x18\x01 \x03(\x0b\x32\x1f.AiService.KeywordSpottingFound\x12\x12\n\nspeaker_id\x18\x02 \x01(\t\x12\x14\n\x0c\x64\x65\x63oder_text\x18\x03 \x01(\t\"A\n\x1dKeywordSpottingConfigResponse\x12\x0f\n\x07success\x18\x01 \x01(\x08\x12\x0f\n\x07keyword\x18\x02 \x03(\t\"\xa6\x01\n\x17KeywordSpottingResponse\x12=\n\x05\x66ound\x18\x01 \x01(\x0b\x32,.AiService.KeywordSpottingFoundEventResponseH\x00\x12:\n\x06\x63onfig\x18\x02 \x01(\x0b\x32(.AiService.KeywordSpottingConfigResponseH\x00\x42\x10\n\x0eresponse_oneof2\xcc\x01\n\rTranscription\x12]\n\x16TranscriptionBiStreams\x12 .AiService.DiscordOpusPacketList\x1a\x1d.AiService.TranscriptionEvent(\x01\x30\x01\x12\\\n\x0fKeywordSpotting\x12!.AiService.KeywordSpottingRequest\x1a\".AiService.KeywordSpottingResponse(\x01\x30\x01\x62\x06proto3')

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
  _globals['_KEYWORDSPOTTINGREQUESTCONFIG']._serialized_end=358
  _globals['_KEYWORDSPOTTINGREQUESTAUDIO']._serialized_start=360
  _globals['_KEYWORDSPOTTINGREQUESTAUDIO']._serialized_end=442
  _globals['_KEYWORDSPOTTINGREQUEST']._serialized_start=445
  _globals['_KEYWORDSPOTTINGREQUEST']._serialized_end=620
  _globals['_KEYWORDSPOTTINGFOUND']._serialized_start=622
  _globals['_KEYWORDSPOTTINGFOUND']._serialized_end=694
  _globals['_KEYWORDSPOTTINGFOUNDEVENTRESPONSE']._serialized_start=696
  _globals['_KEYWORDSPOTTINGFOUNDEVENTRESPONSE']._serialized_end=821
  _globals['_KEYWORDSPOTTINGCONFIGRESPONSE']._serialized_start=823
  _globals['_KEYWORDSPOTTINGCONFIGRESPONSE']._serialized_end=888
  _globals['_KEYWORDSPOTTINGRESPONSE']._serialized_start=891
  _globals['_KEYWORDSPOTTINGRESPONSE']._serialized_end=1057
  _globals['_TRANSCRIPTION']._serialized_start=1060
  _globals['_TRANSCRIPTION']._serialized_end=1264
# @@protoc_insertion_point(module_scope)
