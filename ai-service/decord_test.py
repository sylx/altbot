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

class Frame(object):
    """Represents a "frame" of audio data."""
    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration


def frame_generator(frame_duration_ms, audio, sample_rate):
    """Generates audio frames from PCM audio data.

    Takes the desired frame duration in milliseconds, the PCM data, and
    the sample rate.

    Yields Frames of the requested duration.
    """
    n = int(sample_rate * (frame_duration_ms / 1000.0) * 2)
    offset = 0
    timestamp = 0.0
    duration = (float(n) / sample_rate) / 2.0
    while offset + n < len(audio):
        yield Frame(audio[offset:offset + n], timestamp, duration)
        timestamp += duration
        offset += n

def vad_collector(sample_rate, frame_duration_ms,
                  padding_duration_ms, vad, frames):
    """Filters out non-voiced audio frames.

    Given a webrtcvad.Vad and a source of audio frames, yields only
    the voiced audio.

    Uses a padded, sliding window algorithm over the audio frames.
    When more than 90% of the frames in the window are voiced (as
    reported by the VAD), the collector triggers and begins yielding
    audio frames. Then the collector waits until 90% of the frames in
    the window are unvoiced to detrigger.

    The window is padded at the front and back to provide a small
    amount of silence or the beginnings/endings of speech around the
    voiced frames.

    Arguments:

    sample_rate - The audio sample rate, in Hz.
    frame_duration_ms - The frame duration in milliseconds.
    padding_duration_ms - The amount to pad the window, in milliseconds.
    vad - An instance of webrtcvad.Vad.
    frames - a source of audio frames (sequence or generator).

    Returns: A generator that yields PCM audio data.
    """
    num_padding_frames = int(padding_duration_ms / frame_duration_ms)
    # We use a deque for our sliding window/ring buffer.
    ring_buffer = collections.deque(maxlen=num_padding_frames)
    # We have two states: TRIGGERED and NOTTRIGGERED. We start in the
    # NOTTRIGGERED state.
    triggered = False

    voiced_frames = []
    for frame in frames:
        is_speech = vad.is_speech(frame.bytes, sample_rate)

        sys.stdout.write('1' if is_speech else '0')
        if not triggered:
            ring_buffer.append((frame, is_speech))
            num_voiced = len([f for f, speech in ring_buffer if speech])
            # If we're NOTTRIGGERED and more than 90% of the frames in
            # the ring buffer are voiced frames, then enter the
            # TRIGGERED state.
            if num_voiced > 0.9 * ring_buffer.maxlen:
                triggered = True
                sys.stdout.write('+(%s)' % (ring_buffer[0][0].timestamp,))
                # We want to yield all the audio we see from now until
                # we are NOTTRIGGERED, but we have to start with the
                # audio that's already in the ring buffer.
                for f, s in ring_buffer:
                    voiced_frames.append(f)
                ring_buffer.clear()
        else:
            # We're in the TRIGGERED state, so collect the audio data
            # and add it to the ring buffer.
            voiced_frames.append(frame)
            ring_buffer.append((frame, is_speech))
            num_unvoiced = len([f for f, speech in ring_buffer if not speech])
            # If more than 90% of the frames in the ring buffer are
            # unvoiced, then enter NOTTRIGGERED and yield whatever
            # audio we've collected.
            if num_unvoiced > 0.9 * ring_buffer.maxlen:
                sys.stdout.write('-(%s)' % (frame.timestamp + frame.duration))
                triggered = False
                yield b''.join([f.bytes for f in voiced_frames])
                ring_buffer.clear()
                voiced_frames = []
    if triggered:
        sys.stdout.write('-(%s)' % (frame.timestamp + frame.duration))
    sys.stdout.write('\n')
    # If we have any leftover voiced audio when we run out of input,
    # yield it.
    if voiced_frames:
        yield b''.join([f.bytes for f in voiced_frames])

def write_wave(path, audio, sample_rate):
    """Writes a .wav file.

    Takes path, PCM audio data, and sample rate.
    """
    with contextlib.closing(wave.open(path, 'wb')) as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio)


decoder = Decoder()

packet_length = [175,191,163,152,155,156,149,146,152,157,174,165,151,146,148,156,165,161,151,155,164,163,153,155,164,159,175,180,172,154,150,156,153,160,161,156,158,161,164,152,152,154,153,152,149,149,147,150,156,155,157,154,150,176,201,191,179,174,168,164,165,168,168,172,163,167,177,172,179,175,173,182,174,163,170,162,161,172,166,163,167,180,184,162,157,162,160,148,155,160,162,159,154,151,152,154,156,153,144,145,142,137,140,141,134,142,137,130,146,149,149,129,145,130,163,171,147,164,167,182,176,170,161,178,175,178,183,174,171,158,156,187,184,166,165,173,178,157,151,158,159,157,167,180,174,168,173,159,156,164,178,176,170,168,152,160,159,160,154,156,146,144,147,132,126]
packets = []
# test.binからpacket_length分のbytesを切り出してpacketsに格納する
with open("test.bin","rb") as f:
    for length in packet_length:
        packets.append(f.read(length))

# ここからが本題
# packetsをdecoderに渡す

pcm = b''
for packet in packets:
    pcm+=decoder.decode(packet)

# pcmを1chにする
pcm = np.frombuffer(pcm,dtype=np.int16)
pcm = pcm.reshape(-1,2)[:,0].tobytes()

sample_rate = 48000
vad = webrtcvad.Vad(2)
frames = frame_generator(30, pcm, sample_rate)
frames = list(frames)
segments = vad_collector(sample_rate, 30, 300, vad, frames)

# whisperを使って音声認識する
model=WhisperModel(
    "base",
    device="cuda",
    compute_type="float32"
)

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

transcribe(pcm)

for i, segment in enumerate(segments):
    path = 'chunk-%002d.wav' % (i,)
    print(' Writing %s' % (path,))
    write_wave(path, segment, sample_rate)
    transcribe(segment)

