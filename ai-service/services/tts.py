from pathlib import Path
import sys

from MoeGoe.MoeGoe import *
import numpy as np
import librosa
import soundfile as sf
import io

import tts_pb2
import tts_pb2_grpc
import torch
from memory_profiler import profile
dev = "cuda:0"

class Tts(tts_pb2_grpc.TtsServicer):
   
    def __init__(self) -> None:        
        super().__init__()
        model = f'{Path(__file__).parent.parent}/vits_models/ruise/1158_epochs.pth'
        config = f'{Path(__file__).parent.parent}/vits_models/ruise/config.json'
        self.hps_ms = utils.get_hparams_from_file(config)
        n_speakers = self.hps_ms.data.n_speakers if 'n_speakers' in self.hps_ms.data.keys() else 0
        n_symbols = len(self.hps_ms.symbols) if 'symbols' in self.hps_ms.keys() else 0
        self.speakers = self.hps_ms.speakers if 'speakers' in self.hps_ms.keys() else ['0']
        use_f0 = self.hps_ms.data.use_f0 if 'use_f0' in self.hps_ms.data.keys() else False
        emotion_embedding = self.hps_ms.data.emotion_embedding if 'emotion_embedding' in self.hps_ms.data.keys() else False
        self.net_g_ms = SynthesizerTrn(
            n_symbols,
            self.hps_ms.data.filter_length // 2 + 1,
            self.hps_ms.train.segment_size // self.hps_ms.data.hop_length,
            n_speakers=n_speakers,
            emotion_embedding=emotion_embedding,
            **self.hps_ms.model).to(dev)
        _ = self.net_g_ms.eval()
        self.speaker_id = 0
        utils.load_checkpoint(model, self.net_g_ms)

    def SpeakStream(self, request, context):
        # リクエストを受け取る
        wholeText = request.text
        print(f"received {wholeText}")
        sentences = re.split(r'[。．！？\n]', wholeText)
        for text in sentences:
            # 前後の空白を削除する
            text = text.strip()
            if len(text) == 0:
                continue
            
            # 音声データを生成する
            length_scale, text = get_label_value(text, 'LENGTH', 1, 'length scale')
            noise_scale, text = get_label_value(text, 'NOISE', 0.667, 'noise scale')
            noise_scale_w, text = get_label_value(text, 'NOISEW', 0.8, 'deviation of noise')
            cleaned, text = get_label(text, 'CLEANED')
            stn_tst = get_text(text, self.hps_ms, cleaned=cleaned)
            with no_grad():
                x_tst = stn_tst.unsqueeze(0).to(dev)
                x_tst_lengths = LongTensor([stn_tst.size(0)]).to(dev)
                sid = LongTensor([self.speaker_id]).to(dev)
                audio = self.net_g_ms.infer(x_tst, x_tst_lengths, sid=sid, noise_scale=noise_scale,
                                    noise_scale_w=noise_scale_w, length_scale=length_scale)[0][0, 0].data.cpu().float().numpy()
                # convert sample rate to 24000 using scipy
                audio = audio.astype(np.float32)
                audio = librosa.resample(audio, orig_sr=22050, target_sr=24000) 

                f = io.BytesIO() # create a memory file
                sf.write(f, audio, 24000, format='OGG', subtype='OPUS') # write audio data to memory file
                # return ogg opus audio data
                print(f"encoded {len(audio)} bytes for {text}")
                yield tts_pb2.TtsSpeakResponse(audio=f.getvalue(),text=text)
    
    def GetSpeakers(self, request, context):
        list = tts_pb2.TtsSpeakerInfoList()
        for i, speaker in enumerate(self.speakers):
            list.speakers.append(tts_pb2.TtsSpeakerInfo(index=i+1, name=speaker,selected = i == self.speaker_id))            
        return list
    
    def SetSpeaker(self, request, context):
        index = request.index - 1
        if self.speakers[index] is not None:
            self.speaker_id = index
        speaker=self.speakers[self.speaker_id]
        return tts_pb2.TtsSpeakerInfo(index=self.speaker_id+1, name=speaker,selected = True)
        
