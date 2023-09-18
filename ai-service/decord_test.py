from discord.opus import Decoder
from discord.opus import exported_functions, OpusError, c_float_ptr
from faster_whisper import WhisperModel
import numpy as np
import soundfile as sf
import librosa
import io
import webrtcvad
import sys
import collections
import contextlib
import wave
import time
from libs.vad import VAD


decoder = Decoder()
packet_length = [175,191,163,152,155,156,149,146,152,157,174,165,151,146,148,156,165,161,151,155,164,163,153,155,164,159,175,180,172,154,150,156,153,160,161,156,158,161,164,152,152,154,153,152,149,149,147,150,156,155,157,154,150,176,201,191,179,174,168,164,165,168,168,172,163,167,177,172,179,175,173,182,174,163,170,162,161,172,166,163,167,180,184,162,157,162,160,148,155,160,162,159,154,151,152,154,156,153,144,145,142,137,140,141,134,142,137,130,146,149,149,129,145,130,163,171,147,164,167,182,176,170,161,178,175,178,183,174,171,158,156,187,184,166,165,173,178,157,151,158,159,157,167,180,174,168,173,159,156,164,178,176,170,168,152,160,159,160,154,156,146,144,147,132,126]
packets = []
# test.binからpacket_length分のbytesを切り出してpacketsに格納する
with open("test.bin","rb") as f:
    for length in packet_length:
        packets.append(f.read(length))

vad = VAD(48000,20,300,2) 
# whisperを使って音声認識する
model=WhisperModel(
    "base",
    device="cuda",
    compute_type="float32"
)

# ここからが本題
# packetsをdecoderに渡す packetsにはだいたい20msec分の音声（48000Hz,2ch,16bit）が入っている
# これをVADにより音声区間のみをchunksに格納する
chunks=[]
for packet in packets:
    pcm=decoder.decode(packet)
    # pcmを1chにする
    pcm = np.frombuffer(pcm,dtype=np.int16)
    pcm = pcm.reshape(-1,2)[:,0].tobytes()

    vad.addFrame(pcm)
    if(vad.countFrames() > 50):
        segments=vad.getSpeech()
        if segments is not None:
            for i, audio in enumerate(segments):
                chunks.append(audio)
            vad.clearFrames()

print(f"chunks={len(chunks)}")

def transcribe(pcm):
    # soundfileとlibrosaを使ってpcmを16000Hzのndarrayに変換する
    soundfile=sf.SoundFile(io.BytesIO(pcm),mode='r',format='RAW',subtype='PCM_16',channels=1,samplerate=48000)
    audio,_ = librosa.load(soundfile,sr=16000,mono=True)
    # 16000Hzのfloat32の無音(0)のndarrayを作成してaudioの前後に挿入する
    audio = np.concatenate([np.zeros(16000,dtype=np.float32),audio,np.zeros(16000,dtype=np.float32)])
    
    # wavefileとして保存する
    sf.SoundFile("testbin2.wav",mode='w',format='WAV',subtype='PCM_16',channels=1,samplerate=16000).write(audio)

    global model
    #処理時間を計測する
    start = time.time()
    segments, info = model.transcribe(audio, beam_size=3,language="ja",vad_filter=True,temperature=0,best_of=2)
    elapsed_time = time.time() - start
    for segment in segments:
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
    print ("elapsed_time:{0}".format(elapsed_time) + "[sec]")

for i, chunk in enumerate(chunks):
    # chunkをWAVファイルとして保存する
    sf.SoundFile(f"chunk{i}.wav",mode='w',format='WAV',subtype='PCM_16',channels=1,samplerate=48000).write(np.frombuffer(chunk,dtype=np.int16))
    transcribe(chunk)
