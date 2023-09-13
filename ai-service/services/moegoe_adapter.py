from pathlib import Path
import base64
import sys
import io
import librosa
import soundfile as sf
import base64
import numpy as np

sys.path.append(f'{Path(__file__).parent.parent}/MoeGoe')
from MoeGoe import *

class MoeGoeAdapter():
    hps_ms = None
    net_g_ms = None
    def init(self):
        model = f'{Path(__file__).parent}/moegoe_models/ruise/1158_epochs.pth'
        config = f'{Path(__file__).parent}/moegoe_models/ruise/config.json'

        self.hps_ms = utils.get_hparams_from_file(config)
        n_speakers = self.hps_ms.data.n_speakers if 'n_speakers' in self.hps_ms.data.keys() else 0
        n_symbols = len(self.hps_ms.symbols) if 'symbols' in self.hps_ms.keys() else 0
        speakers = self.hps_ms.speakers if 'speakers' in self.hps_ms.keys() else ['0']
        use_f0 = self.hps_ms.data.use_f0 if 'use_f0' in self.hps_ms.data.keys() else False
        emotion_embedding = self.hps_ms.data.emotion_embedding if 'emotion_embedding' in self.hps_ms.data.keys() else False

        self.net_g_ms = SynthesizerTrn(
            n_symbols,
            self.hps_ms.data.filter_length // 2 + 1,
            self.hps_ms.train.segment_size // self.hps_ms.data.hop_length,
            n_speakers=n_speakers,
            emotion_embedding=emotion_embedding,
            **self.hps_ms.model)
        _ = self.net_g_ms.eval()
        utils.load_checkpoint(model, self.net_g_ms)
        print("inited moegoe")

    def say(self,base64_data):
        text = base64.b64decode(base64_data).decode('utf-8')
        print(text)
        length_scale, text = get_label_value(text, 'LENGTH', 1, 'length scale')
        noise_scale, text = get_label_value(text, 'NOISE', 0.667, 'noise scale')
        noise_scale_w, text = get_label_value(text, 'NOISEW', 0.8, 'deviation of noise')
        cleaned, text = get_label(text, 'CLEANED')
        stn_tst = get_text(text, self.hps_ms, cleaned=cleaned)
        speaker_id = 0
        with no_grad():
            x_tst = stn_tst.unsqueeze(0)
            x_tst_lengths = LongTensor([stn_tst.size(0)])
            sid = LongTensor([speaker_id])
            audio = self.net_g_ms.infer(x_tst, x_tst_lengths, sid=sid, noise_scale=noise_scale,
                                noise_scale_w=noise_scale_w, length_scale=length_scale)[0][0, 0].data.cpu().float().numpy()
            return self.getOggOpusData(audio)

    # from audio(numpy array) to ogg opus audio data(base64 encoded)
    def getOggOpusData(self,audio):
        # convert sample rate to 24000 using scipy
        audio = audio.astype(np.float32)
        audio = librosa.resample(audio, 22050, 24000)
        # convert audio to ogg opus using soundfile
        f = io.BytesIO() # create a memory file
        sf.write(f, audio, 24000, format='OGG', subtype='OPUS') # write audio data to memory file
        return base64.b64encode(f.getvalue()).decode('utf-8') # return base64 encoded audio data
    



        




