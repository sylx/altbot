from faster_whisper import WhisperModel
from discord.opus import Decoder
import numpy as np
import soundfile as sf
import librosa
import io
import asyncio

import transcription_pb2_grpc
from transcription_pb2 import KeywordSpottingFound,KeywordSpottingResponse,KeywordSpottingFoundEventResponse,KeywordSpottingConfigResponse
from transcription_pb2 import TranscriptionConfigResponse,TranscriptionResponse,TranscriptionEventResponse,TranscriptionEventWord
from faster_whisper.transcribe import Word as WhisperWord
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

        # instance cache
        self.model = None
        self.keyword_spotting = None

        self.last_word = {}

        # opus decoder
        self.decoder = Decoder()
        self.lock=threading.Lock()

    def getTranscribeModel(self):
        if self.model is not None:
            return self.model
        print("loading transcribe model...")
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
        pcm  = self.decoder.decode(data)
        # bytes->ndarray
        pcm = np.frombuffer(pcm,dtype=np.int16)
        # stereo->mono
        pcm = pcm.reshape(-1,2)[:,0]
        # int16->float32
        #  (pcm / 32768.0)で正規化すると、-1.0～1.0の範囲になる
        pcm = pcm.astype(np.float32) / 32768.0
        # downsample
        if sample_rate != DISCORD_OPUS_PACKETS_SAMPLE_RATE:
            pcm = librosa.resample(pcm,orig_sr=DISCORD_OPUS_PACKETS_SAMPLE_RATE,target_sr=sample_rate).astype(np.float32)
        return pcm
    
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
    
    def createTranscriptionConfigResponse(self,success):
        config_response=TranscriptionConfigResponse(success=success)
        response=TranscriptionResponse(config=config_response)
        return response
    
    def createTranscriptionEventResponse(self,text,words,start_timestamp,speaker_id,probability,info,opusData=None):
        event_response=TranscriptionEventResponse(
            text=text,
            speaker_id=speaker_id,
            probability=probability,
            info=json.dumps(info),
            opusData=opusData
        )
        for word in words:
            w : WhisperWord = word
            word_response=TranscriptionEventWord(
                word=w.word,
                probability=w.probability,
                timestamp=int((start_timestamp + w.start)*1000.0) # to msec
            )
            event_response.words.append(word_response)

        response=TranscriptionResponse(event=event_response)
        return response

    async def Transcription(self, request_iterator, context):

        # about 20msec frame
        class Frame:
            def __init__(self,audio,timestamp):
                self.audio = audio
                self.timestamp = timestamp
        class FrameBuffer:
            def __init__(self):
                self.frames=[]
            def add(self,frame):
                self.frames.append(frame)
            def getAudio(self):
                return np.concatenate([f.audio for f in self.frames])
            def getTimestamp(self):
                return self.frames[0].timestamp
            def getLength(self):
                return len(self.frames)
            def trim(self,stride_frames):
                self.frames = self.frames[-stride_frames:]
            def clear(self):
                self.frames.clear()
                self.timestamp=0.0
            def clone(self):
                clone = FrameBuffer()
                clone.frames = self.frames.copy()
                return clone

        chunk_frames = 100 # 2000msec
        stride_frames = 50 # 1000msec

        frame_buffer = {}
        flush_size = {}
        stride_time = {}
        frame_time=None
        kw_threshold = 0.5

        model = self.getTranscribeModel()
        keyword_spotting = None
        prompt = ""
        return_opus = False

        futures={}
        event_buffer=[]
        async for request in request_iterator:
            if request.HasField("config"):
                # config
                prompt = request.config.prompt
                if request.config.HasField("kws_config"):
                    keyword_spotting = self.getKeywordSpottingInstance()
                    keyword_spotting.setKeyword(request.config.kws_config.keyword)
                return_opus = request.config.return_opus
                yield self.createTranscriptionConfigResponse(True)
                continue
            if request.HasField("audio"):
                # audio
                packets = request.audio.data
                speaker_id = request.audio.speaker_id
                timestamp = time.time()

                # bufferの取得または作成
                if frame_buffer.get(speaker_id) is None:
                    frame_buffer[speaker_id]=FrameBuffer()
                if flush_size.get(speaker_id) is None:
                    flush_size[speaker_id]=chunk_frames
                if stride_time.get(speaker_id) is None:
                    stride_time[speaker_id]=0.0

                if len(packets) > 0:
                    for packet in packets:
                        pcm = self.decodePacket(packet)
                        if frame_time is None:
                            frame_time = len(pcm) / 16000.0
                        frame_buffer[speaker_id].add(Frame(pcm,timestamp))

                if request.is_final or frame_buffer[speaker_id].getLength() > flush_size[speaker_id]:
                    # 別スレッドで解析するための準備
                    if request.is_final:
                        print(f"Transcription: request is final. {speaker_id}")

                    if futures.get(speaker_id) is None:
                        futures[speaker_id]=[]
                    if len(futures[speaker_id]) > 1:
                        # すでに待機中のスレッドがあるので新たに投入しない
                        # なお、len(futures)が1の場合は処理中の場合と待機中の場合があるが、
                        # 待機中に投入しても実害はないので、投入する
                        continue

                    kw_prompt=""                    
                    if keyword_spotting is not None:
                        result=keyword_spotting(frame_buffer[speaker_id].getAudio())
                        # foundのうちthresholdを超えるものだけを返す
                        result["found"] = [f for f in result["found"] if f["prob"] > kw_threshold]
                        print(f"TranscriptionKW: {result} {speaker_id}")

                        # keywordを元にpromptを更新する
                        if len(result["found"]) > 0:
                            kw_prompt="、".join([f["word"] for f in result["found"]])

                    # 音声解析
                    def onDoneFn():
                        pass
                    transcribe_func = functools.partial(
                        self.transcribe,
                        frame_buffer=frame_buffer[speaker_id].clone(),
                        model=model,
                        prompt=prompt+" "+kw_prompt,
                        speaker_id=speaker_id,
                        event_buffer=event_buffer,
                        return_opus=return_opus,
                        stride_time=stride_time[speaker_id],
                        # buffersを更新する
                        onDoneFn=onDoneFn,
                        lock=self.lock
                    )                            
                    future=asyncio.get_running_loop().run_in_executor(
                            self.pool,
                            transcribe_func
                    )
                    future.add_done_callback(functools.partial(self.onFutreDone,futures=futures,speaker_id=speaker_id))                    
                    futures[speaker_id].append(future)
                    if stride_frames > 0:
                        frame_buffer[speaker_id].trim(stride_frames)
                    else:
                        frame_buffer[speaker_id].clear()
                    flush_size[speaker_id]=chunk_frames+stride_frames
                    stride_time[speaker_id] = stride_frames * frame_time

                #tick event
                if len(event_buffer) > 0:
                    for event in event_buffer:
                        yield event
                    event_buffer.clear()

                if request.is_final:
                    break
            
        print("Transcription: request is over.")

        # futuresを待つ(flatten)
        wait_for_futures = [item for sublist in futures.values() for item in sublist]
        for future in wait_for_futures:
            if future.done() is False:
                await future
                #tick event
                if len(event_buffer) > 0:
                    for event in event_buffer:
                        yield event
                    event_buffer.clear()
        print("Transcription: all done.")

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

    def onFutreDone(self,future,futures=None,speaker_id=""):
        if future.exception() is not None:
            print(future.exception())
            if self.lock.locked():
                print("lock release(abnormal)")
                self.lock.release()
        futures[speaker_id].remove(future)
  
    def transcribe(self,frame_buffer=None,model : WhisperModel=None,prompt="",speaker_id="",event_buffer=None,return_opus=False,stride_time=0.0,onDoneFn=None,lock=None):
        threading.current_thread().name = "transcribe_waiting"
        # 再入禁止
        if lock.acquire(blocking=True,timeout=10) == False:
            raise Exception("lock timeout in transcribe")
        threading.current_thread().name = "transcribe_executing"

        audio=frame_buffer.getAudio()
        #audio = audioFn()
        # 0.5秒の無音(0)のndarrayを作成してaudioの前後に挿入する（認識率が改善する？)
        #audio = np.concatenate([np.zeros(8000,dtype=np.float32),audio,np.zeros(8000,dtype=np.float32)])
        # to int16
        
        print(f"transcribe start {len(audio)} samples. prompt={prompt}")
        segments,info = model.transcribe(audio,
                                            condition_on_previous_text=False,
                                            without_timestamps=False,
                                            prefix="",initial_prompt=prompt,
                                            compression_ratio_threshold=1.5,
                                            beam_size=3,language="ja",vad_filter=False,temperature=[0.0,0.2,0.4],best_of=2,
                                            word_timestamps=True)
        start_time=time.time()
        segments = list(segments) # generatorをlistに変換することでcoroutineを実行する
        end_time = time.time()
        print(f"transcribe done {len(audio)} samples. spent:{int((end_time - start_time)*1000)}msec")
        if len(segments) > 0:
            all_words = [w for s in segments for w in s.words]
            # stride分が除外されたword配列
            words = [w for w in all_words if w.end >= (stride_time - 0.02) and w.probability > 0.01] # stride_timeより前のwordは除外するが、多少の誤差は許容する（多く入るようにする
            probability = 0.0
            if len(words) > 0:
                if words[-1].probability < 0.2:
                    # 最後のwordが不確かなら除外する
                    words = words[:-1]
                
                #前回の最後のwordと今回の最初のwordが同じなら、今回の最初のwordを除外する
                if len(words) > 0 and self.last_word.get(speaker_id) is not None and self.last_word[speaker_id].word == words[0].word:
                    words = words[1:]
                
                if len(words) > 0:
                    self.last_word[speaker_id] = words[-1]
                    # 平均probability
                    probability = sum([w.probability for w in words]) / len(words)
                else:
                    self.last_word[speaker_id] = None

            whole_text = "".join([w.word for w in words])
            # probability = 0
            # for s in segments:
            #     probability+=s.probability
            # probability = probability / len(segments)

            temperature = [s.temperature for s in segments]
            compression_ratio = sum([s.compression_ratio for s in segments]) / len(segments)            
            print(f"transcribed result: {whole_text} {temperature} {compression_ratio}")

            opus = None
            if return_opus:
                # current_audioをoggopus形式で保存しておく
                opus = b''
                with io.BytesIO() as f:
                    sf.write(f, audio, 16000, format='OGG',subtype='OPUS')
                    opus = f.getvalue()
            

            event_buffer.append(
                self.createTranscriptionEventResponse(
                    text = whole_text,
                    words = all_words,
                    start_timestamp = frame_buffer.getTimestamp(),
                    speaker_id = speaker_id,
                    probability = probability,
                    info = {
                        "temperature": temperature,
                        "compression_ratio": compression_ratio
                    },
                    opusData=opus
                )
            )
        onDoneFn()
        print("lock release(normal)")
        lock.release()
        threading.current_thread().name = "transcribe_done"
