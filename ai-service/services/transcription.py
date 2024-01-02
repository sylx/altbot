from faster_whisper import WhisperModel
from discord.opus import Decoder
import numpy as np
import soundfile as sf
import librosa
import io
import asyncio

import transcription_pb2
import transcription_pb2_grpc
from transcription_pb2 import KeywordSpottingFound,KeywordSpottingResponse,KeywordSpottingFoundEventResponse,KeywordSpottingConfigResponse

from libs.vad import VAD
from libs.keyword_spotting import KeywordSpotting

import json
import threading
import time
import functools

import torch

DISCORD_OPUS_PACKETS_SAMPLE_RATE = 48000

class Transcription(transcription_pb2_grpc.TranscriptionServicer):
   
    def __init__(self,pool) -> None:
        super().__init__()
        self.pool = pool        
        self.model = None
        self.keyword_spotting = None
        # opus decoder
        self.decoder = Decoder()
        # 連続音声区間を見つけるためのVAD
        self.vad = {}
        self.event_buffer=[]
        self.lock=threading.Lock()

    def getTranscribeModel(self):
        if self.model is not None:
            return self.model
        
        self.model=WhisperModel(
            "medium",
            device="cuda",
            compute_type="float32",
            download_root="./.model_cache",
        )
        return self.model
    
    def getKeywordSpottingInstance(self):
        if self.keyword_spotting is not None:
            return self.keyword_spotting
        print("create KeywordSpotting instance(include big model)...")
        self.keyword_spotting=KeywordSpotting("./.model_cache",device="cuda:0")
        return self.keyword_spotting


    def decodePacket(self,data,sample_rate=16000):
        pcm = self.decoder.decode(data)
        # pcmを1chにする
        pcm = np.frombuffer(pcm,dtype=np.int16)
        pcm = pcm.reshape(-1,2)[:,0].astype(np.float32)
        # downsample
        if sample_rate != DISCORD_OPUS_PACKETS_SAMPLE_RATE:
            pcm = librosa.resample(pcm,orig_sr=DISCORD_OPUS_PACKETS_SAMPLE_RATE,target_sr=sample_rate).astype(np.float32)
        return pcm
    
    def emitTranscriptionEvent(self,eventName,eventData,opusData=None):
        dataJson=json.dumps(eventData)

        self.event_buffer.append(
            transcription_pb2.TranscriptionEvent(
                eventName=eventName,
                eventData=dataJson,
                opusData=opusData
            )
        )

    def createKeywordSpottingFoundEventResponse(self,kw_results,speaker_id,start_samples=0):
        found_response = KeywordSpottingFoundEventResponse(
            speaker_id=speaker_id,
            decoder_text=kw_results["text"]
        )
        # logits 1stepのサンプル数(近似値)
        step_samples = 320 
        for kw in kw_results["found"]:
            time_samples = ((kw["start"] * step_samples) + start_samples) // 640 # 640で割ることで、1stepの誤差を許容する
            id = f"{speaker_id}-{time_samples}"
            found = KeywordSpottingFound(
                id = id,
                keyword=kw["word"],
                probability=kw["prob"]
            )
            found_response.found.append(found)
        response=KeywordSpottingResponse(found=found_response)
        return response
    
    def createKeywordSpottingConfigResponse(self,success,keyword):
        config_response=KeywordSpottingConfigResponse(success=success,keyword=keyword)
        response=KeywordSpottingResponse(config=config_response)
        return response


    async def TranscriptionBiStreams(self, request_iterator, context):
        speaker_id = ""
        vad = None
        async for request in request_iterator:
            packets = request.packets
            speaker_id = request.speaker_id
            prompt = request.prompt

            # VADの作成
            if self.vad.get(speaker_id) is None:
                self.createVAD(speaker_id)
            vad = self.vad[speaker_id]
            vad.prompt=prompt
            #handler = functools.partial(self.onDetect,prompt=prompt)
            vad.event_emitter.add_listener("detect",self.onDetect)

            if len(packets) > 0:
                for i,packet in enumerate(packets):
                    is_final = request.is_final and i == len(packets)-1
                    self.decodePacket(packet,vad,is_final)
            #tick event
            if len(self.event_buffer) > 0:
                for event in self.event_buffer:
                    yield event
                self.event_buffer.clear()

            if request.is_final:
                vad.event_emitter.remove_listener("detect",self.onDetect)
                break

        # futuresを待つ
        for future in vad.futures:
            if future.done() is False:
                await future
            #tick event
            if len(self.event_buffer) > 0:
                for event in self.event_buffer:
                    yield event
                self.event_buffer.clear()
        if self.voiced_frames.get(speaker_id) is not None:
            del self.voiced_frames[speaker_id]
        if self.transcribed_history.get(speaker_id) is not None:
            del self.transcribed_history[speaker_id]
        print(f"terminated {speaker_id}") 

    async def KeywordSpotting(self, request_iterator, context):
        chunk_size = int(16000 * 0.9) # 0.9sec
        stride_size = int(16000 * 0.6) # 0.6sec
        
        kw=self.getKeywordSpottingInstance()
        buffers = {}
        flush_size = {}
        threshold = 0.5
        buffer_left_samples = 0 # リクエストの最初を0として、バッファが始まった時点でのサンプル数
        buffer_right_samples=0 # リクエストの最初を0として、バッファの最後のサンプル数
        packet_sample_size = int(0.02 * 16000)
        async for request in request_iterator:
            if request.HasField("config"):
                # config
                keyword = request.config.keyword
                kw.setKeyword(keyword)
                if request.config.threshold:
                    threshold = request.config.threshold
                yield self.createKeywordSpottingConfigResponse(True,keyword)
                continue
            if request.HasField("audio"):
                # audio
                packets = request.audio.data
                speaker_id = request.audio.speaker_id

                # bufferの取得または作成
                if buffers.get(speaker_id) is None:
                    buffers[speaker_id]=np.ndarray(shape=(0,),dtype=np.float32)
                if flush_size.get(speaker_id) is None:
                    flush_size[speaker_id]=chunk_size

                if len(packets) > 0:
                    for packet in packets:
                        pcm = self.decodePacket(packet)
                        buffers[speaker_id] = np.concatenate([buffers[speaker_id],pcm])
                    buffer_right_samples += len(packets) * packet_sample_size

                if request.is_final or len(buffers[speaker_id]) > flush_size[speaker_id]:
                    result=kw(buffers[speaker_id])
                    # foundのうちthresholdを超えるものだけを返す
                    result["found"] = [f for f in result["found"] if f["prob"] > threshold]
                    print(f"KeywordSpottingResponse: {result} {speaker_id} {buffer_left_samples/16000:0.2f} {buffer_right_samples/16000:0.2f}")
                    if len(result["found"]) > 0:
                        yield self.createKeywordSpottingFoundEventResponse(result,speaker_id,start_samples=buffer_left_samples)
                    # stride分を残してbufferを更新する
                    buffers[speaker_id]=buffers[speaker_id][-stride_size:]
                    buffer_left_samples = buffer_right_samples - stride_size
                    flush_size[speaker_id]=chunk_size+stride_size

                if request.is_final:
                    break
        print("terminated KeywordSpotting")

    def onDetect(self,voiced_frames=None,proc=None,futures=None):
        if voiced_frames is None or proc is None or futures is None:
            raise Exception("invalid arguments")
        if len(futures) > 1:
            # すでに待機中のスレッドがあるので新たに投入しない
            # なお、len(futures)が1の場合は処理中の場合と待機中の場合があるが、
            # 待機中に投入しても実害はないので、投入する
            return
        # 音声解析にまわす
        future=asyncio.get_running_loop().run_in_executor(
                self.pool,
                proc,
                voiced_frames=voiced_frames,
                lock=self.lock
        )
        future.add_done_callback(functools.partial(self.onProcDone,futures=futures))
        futures.append(future)

    def onProcDone(self,future,futures=None):
        if future.exception() is not None:
            print(future.exception())
            if self.lock.locked():
                print("lock release(abnormal)")
                self.lock.release()
        futures.remove(future)
  
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
        
        transcription_start_time = time.time()
        
        #initial_prompt = prompt + '。'+''.join(self.transcribed_history.get(speaker_id,[]))
        initial_prompt = prompt
        prefix=''        
        #prefix=''.join(self.transcribed_history.get(speaker_id,[]))
        audio = b''.join([f.getAudio() for f in target_voiced_frames])
        #audio = audio + b''.join([f.getAudio() for f in prefix_voiced_frames])

        # soundfileとlibrosaを使ってpcmを16000Hzのndarrayに変換する
        soundfile=sf.SoundFile(io.BytesIO(audio),mode='r',format='RAW',subtype='PCM_16',channels=1,samplerate=48000)
        audio,_ = librosa.load(soundfile,sr=16000,mono=True)

        # 16000Hzのfloat32の無音(0)のndarrayを作成してaudioの前後に挿入する
        audio = np.concatenate([np.zeros(16000,dtype=np.float32),audio,np.zeros(16000,dtype=np.float32)])
        
        print(f"transcribe start {len(audio)} samples. prompt={initial_prompt}")
        segments,info = model.transcribe(audio,
                                            condition_on_previous_text=False,
                                            prefix=prefix,initial_prompt=initial_prompt,
                                            compression_ratio_threshold=1.5,
                                            
                                            beam_size=3,language="ja",vad_filter=False,temperature=[0.0,0.2,0.4],best_of=2,
                                            word_timestamps=False)
        segments = list(segments) # generatorをlistに変換することでcoroutineを実行する
        now = time.time()
        print(f"transcribe done {len(audio)} samples. spent:" +
              f"{int((now - transcription_start_time)*1000)}msec latency:" +
              f"{int((now - target_voiced_frames[0].creation_time)*1000)}msec")
        if len(segments) > 0:
            # voiced_framesにtextを設定する
            whole_text = ''.join([s.text for s in segments])
            # probability = 0
            # for s in segments:
            #     probability+=s.probability
            # probability = probability / len(segments)

            temperature = [s.temperature for s in segments]
            compression_ratio = sum([s.compression_ratio for s in segments]) / len(segments)            
            print(f"transcribed result: {whole_text} {temperature} {compression_ratio}")
            # dump
            for vf in target_voiced_frames:
                vf.transcribed = True

            # 結果を保存する
            if self.transcribed_history.get(speaker_id) is None:
                self.transcribed_history[speaker_id] = []
            self.transcribed_history[speaker_id].append(whole_text)
            if len(self.transcribed_history[speaker_id]) > 3:
                self.transcribed_history[speaker_id]=self.transcribed_history[speaker_id][-3:]

            # current_audioをoggopus形式で保存しておく
            opus = b''
            with io.BytesIO() as f:
                sf.write(f, audio, 16000, format='OGG',subtype='OPUS')
                opus = f.getvalue()

            probability = 0.0
            if compression_ratio > 3.0:
                probability = 0.1
            else:
                for s in segments:
                    probability+=s.avg_logprob
                probability = 1.0 - (probability / len(segments))
            
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
                        "probability": probability,
                },
                opusData=opus
            )
        print("lock release(normal)")
        lock.release()
        threading.current_thread().name = "transcribe_done"
