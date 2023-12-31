from pathlib import Path

from MoeGoe.MoeGoe import *
import numpy as np
import librosa
import soundfile as sf
import io

import tts_pb2
import tts_pb2_grpc
import re

dev = "cuda:0"
import asyncio
import threading

from libs.english_to_kana import EnglishToKana
from libs.reverb import SchroederReverb

from scipy.signal import butter, lfilter

#from libs.tune import autotune

from libs.vits_japros.model import VITSJaProsModel
from libs.vits_japros.text import g2p

from Style_Bert_VITS2.common.tts_model import Model, ModelHolder

import os

def butter_lowpass(cutoff, fs, order=5):
    nyquist = 0.5 * fs
    normal_cutoff = cutoff / nyquist
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    return b, a

def butter_lowpass_filter(data, cutoff, fs, order=5):
    b, a = butter_lowpass(cutoff, fs, order=order)
    y = lfilter(b, a, data)
    return y

def butter_bandpass(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def butter_bandpass_filter(data, lowcut, highcut, fs, order=5):
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    y = lfilter(b, a, data)
    return y


class TtsMoeGoeBackend():
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
        utils.load_checkpoint(model, self.net_g_ms)
    
    def generateSpeech(self,text,speaker_id=1):
        length_scale, text = get_label_value(text, 'LENGTH', 1, 'length scale')
        noise_scale, text = get_label_value(text, 'NOISE', 0.667, 'noise scale')
        noise_scale_w, text = get_label_value(text, 'NOISEW', 0.8, 'deviation of noise')
        cleaned, text = get_label(text, 'CLEANED')
        stn_tst = get_text(text, self.hps_ms, cleaned=cleaned)
        with no_grad():
            x_tst = stn_tst.unsqueeze(0).to(dev)
            x_tst_lengths = LongTensor([stn_tst.size(0)]).to(dev)
            sid = LongTensor([speaker_id]).to(dev)
            # black magic
            audio = self.net_g_ms.infer(x_tst, x_tst_lengths, sid=sid, noise_scale=noise_scale,
                                noise_scale_w=noise_scale_w, length_scale=length_scale)[0][0, 0].data.cpu().float().numpy()
            # convert sample rate to 24000 using scipy
            audio = audio.astype(np.float32)
            audio = librosa.resample(audio, orig_sr=22050, target_sr=24000)
            return audio

class TtsStyleBertVits2Backend():
    def __init__(self):
        super().__init__()
        self.model_holder = ModelHolder(f"./Style_Bert_VITS2/model_assets", "cuda:0")
        self.speakers = list(self.model_holder.model_files_dict.keys())
        self.model_holder.models = {}

    def load_model(self,id):
        if self.model_holder.models.get(id) is None:
            print(f"load model {id}")
            model_paths = self.model_holder.model_files_dict[id]
            model = Model(
                model_path=model_paths[0],
                config_path=os.path.join(self.model_holder.root_dir, id, "config.json"),
                style_vec_path=os.path.join(
                    self.model_holder.root_dir, id, "style_vectors.npy"
                ),
                device=self.model_holder.device,
            )
            model.load_net_g()
            self.model_holder.models[id]=model
        return self.model_holder.models[id]

    def generateSpeech(self,text,speaker_id=1,style='Neutral',style_weight=5.0):
        if speaker_id > len(self.speakers):
            speaker_id = 1
        id = self.speakers[speaker_id-1]
        model = self.load_model(id)
        sr, audio = model.infer(
            text=text,
            language="JP",
            sid=0,
            reference_audio_path=None,
            sdp_ratio=0.2,
            noise=0.6,
            noisew=0.8,
            length=1.0,
            line_split=True,
            split_interval=0.5,
            assist_text=None,
            assist_text_weight=1.0,
            use_assist_text=False,
            style=style,
            style_weight=style_weight
        )
        audio = audio.astype(np.float32)
        audio = librosa.resample(audio, orig_sr=sr, target_sr=24000)
        return audio



class TtsVitsJaProsBackend():
    def __init__(self) -> None:
        super().__init__()
        model_name= "espnet"
        base_dir = f'{Path(__file__).parent.parent}'
        model_path = f"{base_dir}/vits_models/{model_name}/192epoch.pth"
        yaml_file = f"{base_dir}/vits_models/{model_name}/config.yaml"
        device="gpu"
        self.model = VITSJaProsModel(model_name, model_path, yaml_file, device=device)

    def generateSpeech(self,text,speaker_id=1):
        speed_scale = 1.0
        pitch_scale = 1.0
        intonation_scale = 1.0
        noise_scale = 0.0
        noise_scale_dur = 0.0
        p = g2p(text)
        sample_rate,audio=self.model.p2speech(
                p, speed_scale, pitch_scale, intonation_scale, noise_scale, noise_scale_dur
        )
        audio = audio.astype(np.float32)
        audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=24000)
        return audio

class Tts(tts_pb2_grpc.TtsServicer):
   
    def __init__(self,pool) -> None:        
        super().__init__()
        self.pool = pool
        #self.backend = TtsMoeGoeBackend()
        self.backend = TtsStyleBertVits2Backend()
        #self.backend = TtsVitsJaProsBackend()
        self.e2k = EnglishToKana()        
        # reverb
        self.schroeder_reverb = SchroederReverb(
            24000,
            gain_direct = 1.0,
            stage_flg = {
                "comb": True,
                "ap":   True,
            })
        self.lock = threading.Lock()
    
    async def SpeakStream(self, request, context):
        # リクエストを受け取る        
        wholeText = request.text
        # alphabetをカタカナに変換する
        wholeText=re.sub(r'[a-zA-Z]+', lambda m: self.e2k.convert(m.group(),True), wholeText)
        
        speaker_id = request.speaker_id - 1
        # 分割する
        sentences = self.splitText(wholeText,20)
        # 音声データを生成する
        for text in sentences:
            audio = await asyncio.get_running_loop().run_in_executor(self.pool, self.generateSpeech, text,speaker_id,self.lock)
            yield tts_pb2.TtsSpeakResponse(audio=audio,text=text)

    def splitText(self, wholeText,minLength=10):
        ret = []
        sentences = re.split(r'([。．！？\n])', wholeText)
        text = ""
        for i, sentence in enumerate(sentences):
            # 前後の空白を削除する
            sentence = sentence.strip()
            if len(sentence) == 0:
                continue
            # 句読点を残す
            if i % 2 == 0:
                text += sentence
                continue
            # textが短すぎる場合、次の要素と結合する
            if len(text + sentence) < minLength:
                text += sentence
                continue
            ret.append(text + sentence)
            text = ""
        # 最後の要素を処理する
        if len(text) > 0:
            ret.append(text)
        return ret


    def generateSpeech(self,text,speaker_id,lock):
        threading.current_thread().name = "generateSpeech"
        if lock.acquire(blocking=True,timeout=10) == False:
            raise Exception("lock timeout in generateSpeech")
        
        audio=self.backend.generateSpeech(text,speaker_id)
        

        # ピッチをGladosぽくする
        # filtered_audio=butter_bandpass_filter(audio, 500, 4250, 24000)            
        # audio = autotune(audio, 24000,"C:min",0) + autotune(filtered_audio, 24000,"C:min",random.randint(-3, 3))

        # base_pitch=librosa.midi_to_hz(50 + random.randint(-1, 1)*3)
        # pitchs = np.array([base_pitch] * (int(len(audio)/512)+1),dtype=np.float32)
        # audio = psola.vocode(audio, sample_rate=24000, target_pitch=pitchs, fmin=20.0, fmax=5000.0)
        # audio = audio2 + audio3

        # 1秒ほど伸ばす
        audio = np.concatenate([audio,np.zeros(int(24000/2),dtype=np.float32)])

        # PCMデータにリバーブをかける
        audio = self.schroeder_reverb.filt(audio)

        # apply high cut filter
        audio = butter_lowpass_filter(audio, 5500,24000)


        f = io.BytesIO() # create a memory file
        sf.write(f, audio, 24000, format='OGG', subtype='OPUS') # write audio data to memory file
        # return ogg opus audio data
        print(f"encoded {len(audio)} bytes for {text}")
        lock.release()
        return f.getvalue()


    def GetSpeakers(self, request, context):
        list = tts_pb2.TtsSpeakerInfoList()
        for i, speaker in enumerate(self.backend.speakers):
            list.speakers.append(tts_pb2.TtsSpeakerInfo(index=i+1, name=speaker))            
        return list
            
