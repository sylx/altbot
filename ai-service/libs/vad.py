import webrtcvad
import collections
import sys

class Frame(object):
    """Represents a "frame" of audio data."""
    def __init__(self, bytes, timestamp, duration):
        self.bytes = bytes
        self.timestamp = timestamp
        self.duration = duration

class VAD():

    def __init__(self,sample_rate,frame_duration_ms=20, padding_duration_ms=200, aggressiveness=2):
        self.sample_rate=sample_rate
        self.vad=webrtcvad.Vad(aggressiveness)
        self.frame_duration_ms=frame_duration_ms
        self.padding_duration_ms=padding_duration_ms
        self.frames=[]
        self.timestamp=0.0
        self.left_audio=b''
    
    def addFrame(self,audio,timestamp=None):
        if timestamp is not None:
            self.timestamp = timestamp
        audio = self.left_audio + audio
        # n is the number of bytes in each frame sample
        n = int(self.sample_rate * (self.frame_duration_ms / 1000.0) * 2)
        offset = 0
        duration = (float(n) / self.sample_rate) / 2.0
        while offset + n < len(audio):
            self.frames.append(Frame(audio[offset:offset + n], self.timestamp, duration))
            self.timestamp += duration
            offset += n
        # left audio
        self.left_audio = audio[offset:]

    def countFrames(self):
        return len(self.frames)

    def clearFrames(self):
        self.frames=[]

    def terminate(self):
        self.frames=[]
        self.left_audio=b''
    
    def getSpeech(self):
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
        num_padding_frames = int(self.padding_duration_ms / self.frame_duration_ms)
        # We use a deque for our sliding window/ring buffer.
        ring_buffer = collections.deque(maxlen=num_padding_frames)
        # We have two states: TRIGGERED and NOTTRIGGERED. We start in the
        # NOTTRIGGERED state.
        triggered = False

        voiced_frames = []
        for frame in self.frames:
            is_speech = self.vad.is_speech(frame.bytes, self.sample_rate)

            sys.stdout.write('1' if is_speech else '0')
            if not triggered:
                ring_buffer.append((frame, is_speech))
                num_voiced = len([f for f, speech in ring_buffer if speech])
                # If we're NOTTRIGGERED and more than 90% of the frames in
                # the ring buffer are voiced frames, then enter the
                # TRIGGERED state.
                if num_voiced > 0.9 * ring_buffer.maxlen:
                    triggered = True
                    sys.stdout.write('+(%0.2f)' % (ring_buffer[0][0].timestamp,))
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
                    sys.stdout.write('-(%0.2f)' % (frame.timestamp + frame.duration))
                    triggered = False
                    yield [b''.join([f.bytes for f in voiced_frames]),voiced_frames[0].timestamp]
                    ring_buffer.clear()
                    voiced_frames = []
        if triggered:
            sys.stdout.write('-(%0.2f)' % (frame.timestamp + frame.duration))
        sys.stdout.write('\n')
        # If we have any leftover voiced audio when we run out of input,
        # yield it.
        if voiced_frames:
            yield [b''.join([f.bytes for f in voiced_frames]),voiced_frames[0].timestamp]
