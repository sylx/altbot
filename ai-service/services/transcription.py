from services.whisper_online import *
import numpy as np
import soundfile as sf
import librosa
import io
from services.opus_decoder import Decoder
import transcription_pb2
import transcription_pb2_grpc

from memory_profiler import profile

class Transcription(transcription_pb2_grpc.TranscriptionServicer):
    """
    サービス定義から生成されたクラスを継承して、
    定義したリモートプロシージャに対応するメソッドを実装する。
    クライアントが引数として与えたメッセージに対応するオブジェクト
    context引数にはRPCに関する情報を含むオブジェクトが渡される
    """
   
    def __init__(self) -> None:
        super().__init__()
        self.asr = FasterWhisperASR(modelsize="small", lan="ja", cache_dir=".model_cache", model_dir=None)
        self.online = {}
        self.decoder = Decoder()
        self._warmup()

   
    def _warmup(self):
        online = self.getASRProcessor("system")
        online.insert_audio_chunk(np.zeros(16000))
        online.process_iter()
        online.finish()
        
    def getASRProcessor(self,speaker_id):
        if speaker_id in self.online:
            return self.online[speaker_id]
        else:
            self.online[speaker_id] = OnlineASRProcessor(self.asr,create_tokenizer("ja"))
            return self.online[speaker_id]


   
    def TranscriptionBiStreams(self, request_iterator, context):
        # リクエストを受け取る
        online = None
        last_speaker_id = None
        for request in request_iterator:
            audio = request.audio
            print(f"received {len(audio)} bytes")
            sf_file = sf.SoundFile(io.BytesIO(audio),mode='r',format='raw',subtype='PCM_16',channels=1,samplerate=16000)
            # to ndarray
            audio,_ = librosa.load(sf_file,sr=16000)
            #librosa.util.normalize(audio)
            # audio は opus でエンコードされた音声データのバイナリ
#            audio = bytes(audio)
#            audio = self.decoder.decode(audio)
#            sf_file = sf.SoundFile(io.BytesIO(audio),mode='r')
#            audio,_ = librosa.load(sf_file,sr=16000)


            print(f"decoded {len(audio)} bytes")
            out = []
            out.append(audio)
            np.concatenate(out)
            online=self.getASRProcessor(request.speaker_id)
            last_speaker_id = request.speaker_id
            online.insert_audio_chunk(out)
            o = online.process_iter()            
            if o[0] is not None:
                # 音声データを文字列に変換する
                # 音声データを文字列に変換した結果を返す            
                yield transcription_pb2.transcribedText(begin=int(o[0]*1000), end=int(o[1]*1000), speaker_id=request.speaker_id, text=o[2])
        #on close
        if online:
            o=online.finish()
            if o[0] is not None:
                # 音声データを文字列に変換する
                # 音声データを文字列に変換した結果を返す
                yield transcription_pb2.transcribedText(begin=int(o[0]*1000), end=int(o[1]*1000), speaker_id=last_speaker_id, text=o[2])


        
