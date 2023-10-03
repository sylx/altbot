from faster_whisper import WhisperModel
from discord.opus import Decoder
import numpy as np
import soundfile as sf
import librosa
import io
import asyncio

import transcription_pb2
import transcription_pb2_grpc

from libs.vad import VAD

from memory_profiler import profile
import json
import threading

class Transcription(transcription_pb2_grpc.TranscriptionServicer):
    """
    サービス定義から生成されたクラスを継承して、
    定義したリモートプロシージャに対応するメソッドを実装する。
    クライアントが引数として与えたメッセージに対応するオブジェクト
    context引数にはRPCに関する情報を含むオブジェクトが渡される
    """
   
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
        self.prefix = {}
        self.audio_chunk = {}
        self.min_speech_sec = 1.5
        self.index = 0

    def decodePacket(self,packet,vad,is_final=False):
        chunks = []
        pcm = self.decoder.decode(packet.data)
        # pcmを1chにする
        pcm = np.frombuffer(pcm,dtype=np.int16)
        pcm = pcm.reshape(-1,2)[:,0].tobytes()
        
        vad.addFrame(pcm,packet.timestamp)
        if(vad.countFrames() > 50 or is_final):
            segments=vad.getSpeech()
            if segments is not None:
                for i, chunk in enumerate(segments):
                    print(f"found speech {len(chunk[0])} {chunk[1]}")
                    chunks.append(chunk)
                vad.clearFrames()
        return chunks
    
    def emit(self,eventName,eventData,opusData=None):
        dataJson=json.dumps(eventData)

        if eventName == "transcription":
            self.prefix[eventData["speaker_id"]] = eventData["text"]

        return transcription_pb2.TranscriptionEvent(
            eventName=eventName,
            eventData=dataJson,
            opusData=opusData
        )


    async def TranscriptionBiStreams(self, request_iterator, context):
        results = []
        futures = []

        async for request in request_iterator:
            packets = request.packets
            speaker_id = request.speaker_id
            prompt = request.prompt
            audio_chunk = self.audio_chunk.get(speaker_id,None)

            # VADの作成
            if self.vad.get(speaker_id) is None:
                self.vad[speaker_id] = VAD(48000,20,200,2)
            vad = self.vad[speaker_id]

            #結果が来てたら送信する
            if len(results) > 0:
                for result in results:
                    yield result
                results = []

            print(f"received {len(packets)} packets. {speaker_id}")
            if len(packets) > 0:
                for i,packet in enumerate(packets):
                    is_final = request.is_final and i == len(packets)-1
                    chunks = self.decodePacket(packet,vad,is_final)
                    if len(chunks) == 0:
                        continue
                    # chunksを一つに
                    vad_event_chunk = [b''.join([c[0] for c in chunks]),chunks[0][1],sum([c[2] for c in chunks])]
                    yield self.emit("vad",{
                        "speaker_id":speaker_id,
                        "timestamp": vad_event_chunk[1],
                        "duration": vad_event_chunk[2]
                    })
                    # 前回のを加えてchunksを一つに
                    if audio_chunk is not None:
                        chunks.insert(0,audio_chunk)

                    audio_chunk = [b''.join([c[0] for c in chunks]),chunks[0][1],sum([c[2] for c in chunks])]

                # VAD区間がない場合は次のリクエストに期待する
                if audio_chunk is None:
                    continue

                self.audio_chunk[speaker_id] = audio_chunk

                audio = audio_chunk[0]
                start_timestamp = audio_chunk[1]
                duration = audio_chunk[2]

                if duration < self.min_speech_sec * 1000 and request.is_final is False:
                    # 1.5秒以下の音声でまだ途中の場合、次のリクエストを待つ
                    continue
                
                # 解析可能なので、audio_chunkをクリアする
                self.audio_chunk[speaker_id] = None

                # audio を　WAVファイルとして保存する
                # sf.SoundFile(f"server_recv_{self.index}.wav",mode='w',format='WAV',subtype='PCM_16',channels=1,samplerate=48000).write(np.frombuffer(audio,dtype=np.int16))

                print(f"transcribe start {duration} {is_final} {len(audio)}")
                # thread poolを使用してtranscribeを実行する
                futures.append(
                    asyncio.get_running_loop().run_in_executor(self.pool, self.transcribe, 
                                                            self.model, audio, results,self.prefix.get(speaker_id,""), prompt, speaker_id, start_timestamp)
                )
                self.index += 1

            if request.is_final:
                break  
        if vad is not None:
            vad.terminate()
        # futuresを待つ
        for future in futures:
            if future.done() is False:
                await future
                # 結果を送信する
                if len(results) > 0:
                    for result in results:
                        yield result
                    results = []

        print("terminated")
    
    def transcribe(self,model=None,audio=b"",results=[],prefix="",prompt="",speaker_id="",start_timestamp=0):
        threading.current_thread().name = "transcribe"
        # 再入禁止
        lock = threading.Lock()
        if lock.acquire(blocking=True,timeout=10) == False:
            raise Exception("lock timeout in transcribe")

        # soundfileとlibrosaを使ってpcmを16000Hzのndarrayに変換する
        soundfile=sf.SoundFile(io.BytesIO(audio),mode='r',format='RAW',subtype='PCM_16',channels=1,samplerate=48000)
        audio,_ = librosa.load(soundfile,sr=16000,mono=True)

        # 16000Hzのfloat32の無音(0)のndarrayを作成してaudioの前後に挿入する
        audio = np.concatenate([np.zeros(16000,dtype=np.float32),audio,np.zeros(16000,dtype=np.float32)])
        
        print(f"transcribing {len(audio)} samples. prefix={prefix}")
        segments,info = model.transcribe(audio,
                                            condition_on_previous_text=False,
                                            prefix="",initial_prompt=prompt,
                                            compression_ratio_threshold=1.5,
                                            beam_size=3,language="ja",vad_filter=False,temperature=[0.0,0.2],best_of=2)
        segments = list(segments) # generatorをlistに変換することでcoroutineを実行する
        if len(segments) > 0:
            # debug dump
            for segment in segments:
                print(f"transcribed {len(segments)} segments {segment.start} {segment.end} {segment.text}")

            first_segment = segments[0]
            last_segment = segments[-1]

            whole_text = ''.join([s.text for s in segments])

            # audioをoggopus形式で保存しておく
            opus = b''
            with io.BytesIO() as f:
                sf.write(f, audio, 16000, format='OGG',subtype='OPUS')
                opus = f.getvalue()
            results.append(self.emit(
                eventName="transcription",
                eventData={
                    "begin": start_timestamp+int(first_segment.start*1000),
                    "end": start_timestamp+int(last_segment.end*1000),
                    "packet_timestamp": start_timestamp,
                    "text": whole_text,
                    "speaker_id": speaker_id
                },
                opusData=opus
            ))
        lock.release()

        
