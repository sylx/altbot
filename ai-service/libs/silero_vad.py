import torch

class SileroVAD:
    def __init__(self, cache_dir, device="cpu",sample_rate=16000):
        self.device = device
        self.sample_rate=sample_rate        
        torch.hub.set_dir(f'{cache_dir}/hub',)
        model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                              model='silero_vad',
                              force_reload=False,
                              onnx=False)
        model.to(self.device)
        self.model=model
        self.utils=utils
        self.buffer={}

    def getSpeechProb(self,audio):
        return self.model(audio,self.sample_rate)
    
    def addFrame(self,audio,speaker_id):
        if self.buffer.get(speaker_id) is None:
            self.buffer[speaker_id]=[]
        self.buffer[speaker_id].append(audio)
    
    def getVoicedFrames(self,speaker_id):
        if self.buffer.get(speaker_id) is None:
            return None
        audio=torch.cat(self.buffer[speaker_id])
        self.buffer[speaker_id]=[]
        return self.vad_iterator(audio,return_seconds=False)