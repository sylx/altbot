from transformers import Wav2Vec2Tokenizer, Wav2Vec2FeatureExtractor,Wav2Vec2ForCTC,Wav2Vec2Processor
import torch
import jaconv

MODEL_NAME = "AndrewMcDowell/wav2vec2-xls-r-300m-japanese"

class Beam:
    def __init__(self,word,ids,priority,alt_ids=None):
        self.word=word
        self.priority=priority
        self.ids=ids
        if alt_ids is None:
            self.alt_ids=[None]*len(ids)
        else:
            self.alt_ids=alt_ids
        
        self.result=None
        self.start_index=0
        self.prob_total=0.0
        self.unmatch_count=0
        # 許容するunmatchの回数(6文字ごとに1回) 4文字未満なら-1(一度もunmatchできない)
        self.unmatch_threshold=len(self.ids)//4 - 1
        self.id_index=0
        self.forked=False

    def __repr__(self):
        return f"{self.word} {self.current_prob()}"
    
    def initialize(self,result):
        self.result=result
        self.reset()
    
    def reset(self):
        self.start_index=0
        self.prob_total=0.0
        self.unmatch_count=0
        self.id_index=0

    # 不一致の時のハンドラ。余計な発音が挟まってる場合があるので、二回連続まで許容する
    def unmatch(self):
        #print(f"unmatch {i} expect {tokenizer.convert_ids_to_tokens(ids[id_index])}({ids[id_index]}) top1 is {tokenizer.convert_ids_to_tokens(top1_id)}({top1_id}) current={current_prob} last={last_id_prob} pad={pad_prob} ")
        if self.unmatch_count > self.unmatch_threshold:
            #print(f"{self.id} unmatch count is {self.unmatch_count} so reset")
            self.reset()
            return
        else:
            # 余計な発音の場合と、完全に聞き取れなかった場合がある。後者の場合は、id_index++しないといけないので分岐させる
            forkBeam=None
            if self.id_index > 0 and self.id_index+1 < len(self.ids) and self.forked is False:
                forkBeam=Beam(self.word,self.ids,self.priority)
                forkBeam.id_index=self.id_index+1
                forkBeam.prob_total=self.prob_total
                forkBeam.start_index=self.start_index
                forkBeam.result=self.result
                forkBeam.forked=True
            self.unmatch_count+=1
            return forkBeam
        
    def step(self,probs,step,threshold):
        prob_indies=[self.ids[self.id_index]]
        if self.alt_ids[self.id_index] is not None:
            prob_indies.extend(self.alt_ids[self.id_index])
        step_prob=probs[prob_indies].max()
    
        #last_id_prob=probs[self.ids[self.id_index-1]] if self.id_index > 0 else 0.0

        # id_index==0の時は、BEAM段階で刈り取られているので、調べるまでもなく、thresholdを上回っている（筈）
        if self.id_index == 0:
            self.start_index=step
        elif step_prob < threshold:
            return self.unmatch()

        self.id_index+=1
        self.unmatch_count=0
        self.prob_total+=step_prob
        if self.id_index == len(self.ids):
            #終了
            # 0.01以下の場合は、結果としては切り捨てる
            result_prob= self.current_prob().item()
            if result_prob > 0.01:
                self.result.append({
                    "word": self.word,
                    "start": self.start_index,
                    "end": step,
                    "prob": result_prob
                })
            self.reset()
            return

    def current_prob(self):
        if self.id_index > 0:
            return self.prob_total / self.id_index
        else:
            return 0.0
    
    def max_prob(self):
        return max(self.result,key=lambda x:x["prob"])

class KeywordSpotting:
    def __init__(self, cache_dir, device="cpu"):
        self.device = device
        self.model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME,cache_dir=cache_dir,torch_dtype=torch.float16).to(self.device)
        self.processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
        self.tokenizer = self.processor.tokenizer
        self.feature_extractor = self.processor.feature_extractor
        self.words=[]

    def setKeyword(self,words):
        self.words=words
        self.beams={}
        for i,word in enumerate(words):
            ids = self.tokenizer.convert_tokens_to_ids(self.tokenizer.tokenize(word))
            # すべてひらがなにしてidsを作成する
            hira_word = jaconv.kata2hira(word)
            hira_ids = self.tokenizer.convert_tokens_to_ids(self.tokenizer.tokenize(hira_word))
            # すべてカタカナにしてidsを作成する
            kata_word = jaconv.hira2kata(word)
            kata_ids = self.tokenizer.convert_tokens_to_ids(self.tokenizer.tokenize(kata_word))

            alt_ids=[None]*len(ids)
            for i in range(len(ids)):
                alt=[]
                if ids[i] != hira_ids[i]:
                    alt.append(hira_ids[i])
                if ids[i] != kata_ids[i]:
                    alt.append(kata_ids[i])
                if len(alt) > 0:
                    alt_ids[i]=alt

            beam = Beam(word,ids,i,alt_ids=alt_ids)
            first_token=beam.ids[0]
            if self.beams.get(first_token) is None:
                self.beams[first_token]=[]
            self.beams[first_token].append(beam)

    def __call__(self, audio):
        input_values = self.processor(audio, return_tensors="pt", sampling_rate=16000).input_values.to(self.device)
        # convert float16
        input_values=input_values.half()        
        logits = self.model(input_values).logits
        return self.get_keywords_avgprobs(self.beams,logits)

    def get_keywords_avgprobs(self,beams,logits,num_beams=5,topk=5,without_pad=True):
        result=[]
        for beam_list in self.beams.values():
            for beam in beam_list:
                beam.initialize(result)

        logits_prob=torch.softmax(logits[0,:,:],dim=1, dtype=torch.float16)
        # 上位N件の確率を取得
        topk_values, topk_indices = torch.topk(logits_prob, topk)
        threshold = topk_values[:,-1]

        # padが一位のstepを除外しておく（10倍以上高速化するが認識率は悪化する) 
        if without_pad:
            steps=torch.where(topk_indices[:,0]!=self.tokenizer.pad_token_id)[0].tolist()
        else:
            steps=range(len(logits_prob))

        current_beams=[]
        for i in steps:
            topKList=topk_indices[i,:].tolist()
            # topKにあるものを候補に加える(末尾に)これはnum_beamsとは別枠
            for id in topKList:
                current_beams.extend(beams.get(id,[]))
            #重複を排除(順序を維持する)
            current_beams=sorted(set(current_beams),key=lambda x: -x.id_index)
            #print(f"step={i} {list(map(lambda x:[x.id,x.id_index],current_beams))} {tokenizer.convert_ids_to_tokens(topKList)}")

            next_beams=[]
            for beam in current_beams:
                forked=beam.step(logits_prob[i,:],i,threshold[i])
                if forked is not None:
                    next_beams.append(forked)
                if beam.id_index != 0:
                    #マッチしたものだけ次も継続する
                    next_beams.append(beam)
                else:
                    #マッチしなかったものは終了
                    #print(f"{beam.id} is unmatch")
                    pass

            if len(next_beams) > num_beams:
                #確率の高いものからnum_beams件だけ残す
                current_beams=sorted(next_beams,key=lambda x: -x.current_prob())
                #print(f"cut {len(next_beams)} to {num_beams} -> {list(map(lambda x:[x.id,x.id_index],current_beams[num_beams:]))}")
                for b in current_beams[num_beams:]:
                    b.reset()
                current_beams=current_beams[:num_beams]
            else:
                current_beams=next_beams

        # 普通のデコード
        pred_ids = torch.argmax(logits, axis=-1)
        return {
            "found": sorted(result,key=lambda x: -x["prob"]),
            "text": self.processor.batch_decode(pred_ids)[0]
        }