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
            "small",
            device="cuda",
            compute_type="float16",
            download_root="./.model_cache",
        )
        self.pool = pool
        self.decoder = Decoder()
        self.vad = {}
        self.prefix = {}
        self.min_speech_sec = 1
        self.index = 0

    def decodePacket(self,packet,vad):
        chunks = []
        pcm = self.decoder.decode(packet.data)
        # pcmを1chにする
        pcm = np.frombuffer(pcm,dtype=np.int16)
        pcm = pcm.reshape(-1,2)[:,0].tobytes()
        
        vad.addFrame(pcm,packet.timestamp)
        if(vad.countFrames() > 50):
            segments=vad.getSpeech()
            if segments is not None:
                for i, chunk in enumerate(segments):
                    print(f"found speech {len(chunk[0])} {chunk[1]}")
                    chunks.append(chunk)
                vad.clearFrames()
        return chunks
    
    def emit(self,eventName,eventData):
        dataJson=json.dumps(eventData)
        return transcription_pb2.TranscriptionEvent(
            eventName=eventName,
            eventData=dataJson
        )


    async def TranscriptionBiStreams(self, request_iterator, context):
        last_chunk = None
        vad = None
        results = []
        futures = []

        async for request in request_iterator:
            packets = request.packets
            speaker_id = request.speaker_id
            prompt = request.prompt
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
                for packet in packets:
                    chunks = self.decodePacket(packet,vad)
                    if len(chunks) == 0:
                        continue
                    # chunksを一つに
                    chunk = [b''.join([c[0] for c in chunks]),chunks[0][1],sum([c[2] for c in chunks])]
                    yield self.emit("vad",{
                        "speaker_id":speaker_id,
                        "duration": chunk[2]
                    })
                    audio = chunk[0]
                    start_timestamp = chunk[1]
                    duration = chunk[2]

                    # 前回結果の末尾から1秒未満の間隔であれば結合したchunkを作成する
                    if last_chunk is not None and last_chunk[1] + last_chunk[2] + 1000 > start_timestamp:
                        chunk = [last_chunk[0] + audio,last_chunk[1],last_chunk[2] + chunk[2]]
                        print(f"concat last_chunk")
                        audio = chunk[0]
                        start_timestamp = chunk[1]
                        
                    # audio を　WAVファイルとして保存する
                    # sf.SoundFile(f"server_recv_{self.index}.wav",mode='w',format='WAV',subtype='PCM_16',channels=1,samplerate=48000).write(np.frombuffer(audio,dtype=np.int16))

                    # thread poolを使用してtranscribeを実行する
                    futures.append(
                        asyncio.get_running_loop().run_in_executor(self.pool, self.transcribe, 
                                                               self.model, audio, results,self.prefix.get(speaker_id,""), prompt, speaker_id, start_timestamp)
                    )

                    self.index += 1
                    last_chunk = chunk

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
        # soundfileとlibrosaを使ってpcmを16000Hzのndarrayに変換する
        soundfile=sf.SoundFile(io.BytesIO(audio),mode='r',format='RAW',subtype='PCM_16',channels=1,samplerate=48000)
        audio,_ = librosa.load(soundfile,sr=16000,mono=True)

        # 16000Hzのfloat32の無音(0)のndarrayを作成してaudioの前後に挿入する
        audio = np.concatenate([np.zeros(16000,dtype=np.float32),audio,np.zeros(16000,dtype=np.float32)])
        
        print(f"transcribing {len(audio)} samples...")
        segments,info = model.transcribe(audio,
                                            condition_on_previous_text=False,
                                            prefix=prefix,initial_prompt=prompt,
                                            beam_size=3,language="ja",vad_filter=True,temperature=[0.0,0.2],best_of=2)
        segments = list(segments) # generatorをlistに変換することでcoroutineを実行する
        if len(segments) > 0:
            # debug dump
            for segment in segments:
                print(f"transcribed {len(segments)} segments {segment.start} {segment.end} {segment.text}")

            first_segment = segments[0]
            last_segment = segments[-1]

            whole_text = ''.join([s.text for s in segments])
            results.append(self.emit(
                eventName="transcription",
                eventData={
                    "begin": start_timestamp+int(first_segment.start*1000),
                    "end": start_timestamp+int(last_segment.end*1000),
                    "packet_timestamp": start_timestamp,
                    "text": whole_text,
                    "speaker_id": speaker_id
            }))
        
