from faster_whisper import WhisperModel
from discord.opus import Decoder
import numpy as np
import soundfile as sf
import librosa
import io
import asyncio
from pyee import AsyncIOEventEmitter

import transcription_pb2
import transcription_pb2_grpc

from libs.vad import VAD

from memory_profiler import profile
import json
import threading

class Transcription(transcription_pb2_grpc.TranscriptionServicer):
   
    def __init__(self,pool) -> None:
        super().__init__()
        self.model=WhisperModel(
            "medium",
            device="cuda",
            compute_type="float16",
            download_root="./.model_cache",
        )
        self.pool = pool
        self.decoder = Decoder()
        self.vad = {}
        self.voiced_frames = {}
        self.min_speech_sec = 1.5
        self.index = 0
        self.ee = AsyncIOEventEmitter(asyncio.get_running_loop())
        self.event_buffer=[]
        self.futures=[]
        self.lock=threading.Lock()

    def decodePacket(self,packet,vad,is_final=False):
        pcm = self.decoder.decode(packet.data)
        # pcmを1chにする
        pcm = np.frombuffer(pcm,dtype=np.int16)
        pcm = pcm.reshape(-1,2)[:,0].tobytes()
        
        vad.addFrame(pcm,packet.timestamp,final=is_final)
    
    def emit(self,eventName,eventData,opusData=None):
        dataJson=json.dumps(eventData)

        self.event_buffer.append(
            transcription_pb2.TranscriptionEvent(
                eventName=eventName,
                eventData=dataJson,
                opusData=opusData
            )
        )

    def createVAD(self,speaker_id):
        self.vad[speaker_id] = VAD(48000,20,200,2,event_emitter=self.ee,speaker_id=speaker_id)

    async def TranscriptionBiStreams(self, request_iterator, context):
        speaker_id = ""
        async for request in request_iterator:
            packets = request.packets
            speaker_id = request.speaker_id
            prompt = request.prompt

            # VADの作成
            if self.vad.get(speaker_id) is None:
                self.createVAD(speaker_id)
            vad = self.vad[speaker_id]
            self.ee.on("detect",self.onDetect)

            if len(packets) > 0:
                for i,packet in enumerate(packets):
                    is_final = request.is_final and i == len(packets)-1
                    self.decodePacket(packet,vad,is_final)
            #tick
            if len(self.event_buffer) > 0:
                for event in self.event_buffer:
                    yield event
                self.event_buffer.clear()

            if request.is_final:
                break

        # futuresを待つ
        for future in self.futures:
            if future.done() is False:
                await future
            #tick
            if len(self.event_buffer) > 0:
                for event in self.event_buffer:
                    yield event
                self.event_buffer.clear()
        self.voiced_frames[speaker_id] = None
        print("terminated") 

    def onDetect(self,voiced_frames):
        self.emit("vad",{
            "id": voiced_frames.id,
            "speaker_id": voiced_frames.speaker_id,
            "timestamp": voiced_frames.getBegin(),
            "duration": voiced_frames.getDuration(),            
        })
        # 過去の音声と結合
        if self.voiced_frames.get(voiced_frames.speaker_id) is None:
            self.voiced_frames[voiced_frames.speaker_id] = [voiced_frames]
        else:
            self.voiced_frames[voiced_frames.speaker_id].append(voiced_frames)

        # 音声解析にまわす
        self.futures.append(
            asyncio.get_running_loop().run_in_executor(
                self.pool,
                self.transcribe,
                self.model,
                "", # prompt
                voiced_frames.speaker_id,
                self.lock
        ))

    def transcribe(self,model=None,prompt="",speaker_id="",lock=None):
        threading.current_thread().name = "transcribe_waiting"
        # 再入禁止
        if lock.acquire(blocking=True,timeout=10) == False:
            raise Exception("lock timeout in transcribe")
        threading.current_thread().name = "transcribe_executing"

        # テキストの入っていない音声のみを対象にする
        target_voiced_frames = [f for f in self.voiced_frames[speaker_id] if f.transcribed == False]
        if len(target_voiced_frames) == 0:
            lock.release()
            return
        
        initial_prompt = prompt
        audio = b''.join([f.getAudio() for f in target_voiced_frames])

        # soundfileとlibrosaを使ってpcmを16000Hzのndarrayに変換する
        soundfile=sf.SoundFile(io.BytesIO(audio),mode='r',format='RAW',subtype='PCM_16',channels=1,samplerate=48000)
        audio,_ = librosa.load(soundfile,sr=16000,mono=True)

        # 16000Hzのfloat32の無音(0)のndarrayを作成してaudioの前後に挿入する
        audio = np.concatenate([np.zeros(16000,dtype=np.float32),audio,np.zeros(16000,dtype=np.float32)])
        
        print(f"transcribe start {len(audio)} samples. prompt={prompt}")
        segments,info = model.transcribe(audio,
                                            condition_on_previous_text=False,
                                            prefix="",initial_prompt=initial_prompt,
                                            compression_ratio_threshold=1.5,
                                            beam_size=3,language="ja",vad_filter=False,temperature=[0.0,0.2,0.4],best_of=2,
                                            word_timestamps=False)
        segments = list(segments) # generatorをlistに変換することでcoroutineを実行する
        if len(segments) > 0:
            # voiced_framesにtextを設定する
            whole_text = ''.join([s.text for s in segments])
            temperature = sum([s.temperature for s in segments]) / len(segments)
            compression_ratio = sum([s.compression_ratio for s in segments]) / len(segments)            
            # dump
            for vf in target_voiced_frames:
                vf.transcribed = True

            if compression_ratio > 1.5:
                # compression_retio_threshold設定してるのに、なぜか超えてしまう場合がある
                lock.release()
                return

            # current_audioをoggopus形式で保存しておく
            opus = b''
            with io.BytesIO() as f:
                sf.write(f, audio, 16000, format='OGG',subtype='OPUS')
                opus = f.getvalue()

            self.emit(
                eventName="transcription",
                eventData={
                        "ids": [f.id for f in target_voiced_frames],
                        "begin": target_voiced_frames[0].getBegin(),
                        "end": target_voiced_frames[-1].getEnd(),
                        "packet_timestamp": target_voiced_frames[0].getBegin(),
                        "text": whole_text,
                        "speaker_id": speaker_id,
                        "temperature": temperature,
                        "compression_ratio": compression_ratio,
                },
                opusData=opus
            )
        
        lock.release()
        threading.current_thread().name = "transcribe_done"
