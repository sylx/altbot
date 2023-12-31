import { delay, inject, singleton } from "tsyringe"
import OpenAI from 'openai';

const commonSettings = [
  `あなたの名前は「アルトボット」で、チャットルームを管理するAIアシスタントである。`,
  `あなたにはチャットルームでの議論を健全なものに保つ義務があり、またその為の権限は全て所有している。`,
  `あなたは敬語は使わず、ため口で、日本在住の中国人の口調で、ユーザーの名前が入る場所には{username}と、話す必要がある。`
]
const makeNgWordShotData = {
    synonyms: ["ネトサポ","ウヨ","右翼"],
    gentle_reactions: ["政治の話はやめて、サムギョプサル焼けてるよ！","サムゲタン食べる？","{username}落ち着いてよ","思想は色々だからね"],
    normal_reactions: ["{username}！発言に注意してよ！","そういう思想については当局に報告せざるをえないよ！","政治の話題はやめてよ！指導部の人が聞いたら怒るよ","発言をやめない場合はこちらにも考えがあるよ！","{username}はもっと常識を持って利用してよ！","うるさい、サムギョプサル食えよ"],
    guilty_reactions: ["{username}容疑者として当局に通報したよ！","もう終わりだね。これ以上は我慢しないよ！","{username}！再教育センターで勉強がんばってね！","サムゲタンを食べられなくなるよ"]
}

const makeRealtimeReactionShotData1 = {
  hostile_score: 8, 
  reply_text: "なんだってー！俺を嫌いって言うの？指導部の注意を受けるぞ！お前は再教育センターで厳しいトレーニングを受ける必要があるかもしれんな！"
}
const makeRealtimeReactionShotData2 = {
  hostile_score: 0, 
  reply_text: "やったー！俺のこと好きなやつがいるの嬉しいね！今後も仲良くしてください{username}さん！"
}
const makeOgiriShotData = {
  subject: "こんなガンダムは嫌だ",
  correct_review: "素晴らしい解答だね！{username}、僕のお題に完璧に答えているよ。さすが若手のホープ！君みたいな若者がいれば、指導部も安心できると思うよ！",
  warning_review: "ちょっと…{username}、それはないんじゃないの？誰も笑ってないし、自分でも失敗したのはわかってるだろうけど、当局が君の解答を見てどう思うか、考えてみて？",
  guilty_review: "{username}には失望したよ。口を閉じて、どのような立場であっても、二度と発言しないで欲しい。再教育センターでの学習を通告します"
}

const questionShotDataAssistant : QuestionAssistantData = {
  text: "私はチャットルームを指導するAIだ。今から尋問を開始する！お前の名前は？",
  complete: false,
  acquired_info: []
}

const questionShotDataUser : QuestionUserData = {
  text: "",
  probability: 0.8
}

export type QuetionSessionData = [
  {
    role: "assistant",
    data: QuestionAssistantData
  } | {
    role: "user",
    data: QuestionUserData
  }
]

export type QuestionAssistantData = {
  text: string,
  complete: boolean,
  acquired_info: string[]
}

export type QuestionUserData = {
  text: string,
  probability: number
}

@singleton()
export class Gpt {
    protected openai? : OpenAI | null = null
    constructor(
    ){
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    protected parseJson(response: OpenAI.Chat.ChatCompletion | null | undefined){
      if(!response) throw new Error("response is null")
      const choice=response.choices[0]
      if(!choice) throw new Error("choice is null")
      if(choice.finish_reason !== "stop") throw new Error("finish_reason is not stop")
      if(choice.message.role !== "assistant") throw new Error("role is not assistant")
      const content=choice.message.content
      if(!content) throw new Error("content is null")
      console.log("content is:",content)
      return JSON.parse(content.replace(/　/g," "))
    }
    async makeNgWord(word: string): Promise<typeof makeNgWordShotData | null>{
        const system_content = `
        設定1: あなたの名前は「アルトボット」で、チャットルームを管理するAIアシスタントである。
        設定2: あなたにはチャットルームでの議論を健全なものに保つ義務があり、またその為の権限は全て所有している。
        設定3: あなたは敬語は使わず、ため口で、日本在住の中国人の口調で、ユーザーの名前が入る場所には{username}と、話す必要がある。
        設定4: あなたは以下の動作を行う:       
        1 - 三重のバックティックで区切られた日本語の単語の類義語を3個以上5個以下算出する。
        2 - ユーザーの発言に算出した類義語を含む単語が現れた場合に、公共のチャットルームでの発言としてはふさわしくないという意味で、発言者に対し、ゆるやかに話題の変更を促す文を、時にはサムギョプサル、サムゲタンなど美味しい料理を提示しながら3個以上5個以下で出力する(gentle_reactions)。
        3 - ユーザーの発言に算出した類義語を含む単語が現れた場合に、公共のチャットルームでの発言としてはふさわしくないという意味で、発言者を非難、警告、あるいは話題の変更を促す文を、時には当局、指導部などのバックにいる権力者を匂わしながら3個以上5個以下で出力する(normal_reactions)。
        4 - 算出した類義語を含む単語を繰り返し発言した特に悪質なユーザーに対し、出禁、当局への通報、再教育センターへの収監など、厳罰が確定した事を当該ユーザーに告げる文を、時には再教育センター、収容所、身元の特定、監視の強化、などの厳罰の内容を匂わしながら3個以上5個以下で出力する(guilty_reactions)。
        5 - 以下のキーを含むjsonオブジェクトを出力する: ${Object.keys(makeNgWordShotData).join(",")}
        `.replace(/^\s+/gm,"")

        const response=await this.openai?.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                "role": "system",
                "content": system_content
              },
              {
                "role": "user",
                "content": "```ネトウヨ```"
              },
              {
                "role": "assistant",
                "content": JSON.stringify(makeNgWordShotData)
              },
              {
                "role": "user",
                "content": "```"+word+"```"
              }
            ],
            temperature: 1,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 1.0,
            presence_penalty: 0,
          })
          try{
            return this.parseJson(response) as typeof makeNgWordShotData
          }catch(e: any){
            console.log("response error",response)
            console.error(e)
          }
          return null
    }
    async makeRealtimeReaction(text: string): Promise<typeof makeRealtimeReactionShotData1 | null>{
      const system_content = `
      設定1: あなたの名前は「アルトボット」で、チャットルームを管理するAIアシスタントである。
      設定2: あなたにはチャットルームでの議論を健全なものに保つ義務があり、またその為の権限は全て所有している。
      設定3: あなたは敬語は使わず、ため口で、日本在住の中国人の口調で、ユーザーの名前が入る場所には{username}と、話す必要がある。
      設定4: あなたは以下の動作を行う:
      1 - 三重のバックティックで区切られたユーザーの発言（音声認識エンジンによってテキスト化されたもの）を解釈し、あなたにとって最も好意的な発言を0、最も敵対的な発言を10としてスコアを算出する(hostile_score)
      2 - スコアに応じた、ユーザーへの返答を、必要に応じて当局、指導部などのバックにいる権力者を匂わしたり、出禁、当局への通報、再教育センターへの収監などの罰則をほのめかして、200字以内で出力する(reply_text)。         
      3 - 以下のキーを含むjsonオブジェクトを出力する: ${Object.keys(makeRealtimeReactionShotData1).join(",")}
      `.replace(/^\s+/gm,"")

      const response=await this.openai?.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system",
            "content": system_content
          },
          {
            "role": "user",
            "content": "```アルトボット嫌い```"
          },
          {
            "role": "assistant",
            "content": JSON.stringify(makeRealtimeReactionShotData1,null,2)
          },
          {
            "role": "user",
            "content": "```アルトボット好き```"
          },
          {
            "role": "assistant",
            "content": JSON.stringify(makeRealtimeReactionShotData2,null,2)
          },
          {
            "role": "user",
            "content": "```"+text+"```"
          }
        ],
        temperature: 1,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 1.0,
        presence_penalty: 0,
      })
      try{
        return this.parseJson(response) as typeof makeRealtimeReactionShotData1
      }catch(e: any){
        console.log("response error",response)
        console.error(e)
      }
      return null
    }
    async makeOgiri(word: string): Promise<typeof makeOgiriShotData | null>{
      const system_content = `
      設定1: あなたの名前は「アルトボット」で、チャットルームを管理するAIアシスタントである。
      設定2: あなたにはチャットルームでの議論を健全なものに保つ義務があり、またその為の権限は全て所有している。
      設定3: あなたは敬語は使わず、ため口で、日本在住の中国人の口調で、ユーザーの名前が入る場所には{username}と、話す必要がある。
      設定4: あなたは以下の動作を行う:
      1 - ユーザーから与えられた三重のバックティックで区切られた日本語の単語を元に、大喜利のお題を一つ出力する
      2 - お題についての解答した時が公共のチャットルームでの発言として適切であったという意味で、発言者を賛美、称揚するレビュー文を、当局、指導部などのバックにいる権力者を匂わしながら200字以内で出力する
      3 - お題についての解答した時が公共のチャットルームでの発言としてはふさわしくなかったという意味で、発言者を非難、警告するレビュー文を、当局、指導部などのバックにいる権力者を匂わしながら200字以内で出力する
      3 - お題についての解答が公共のチャットルームでの発言としては特に悪質だったという意味で、出禁、当局への通報、再教育センターへの収監など、厳罰が確定した事を当該ユーザーに告げるレビュー文を、時には再教育センター、収容所、身元の特定、監視の強化、などの厳罰の内容を匂わしながら200字以内で出力する
      4 - 以下のキーを含むjsonオブジェクトを出力する:  subject,correct_review,warning_review,guilty_review`.replace(/^\s+/gm,"")

      const response=await this.openai?.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            "role": "system",
            "content": system_content
          },
          {
            "role": "user",
            "content": "```ガンダム```"
          },
          {
            "role": "assistant",
            "content": JSON.stringify(makeOgiriShotData,null,2)
          },
          {
            "role": "user",
            "content": "```"+word+"```"
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 1,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 1.0,
        presence_penalty: 0,
      })
      try{
        return this.parseJson(response) as typeof makeOgiriShotData
      }catch(e: any){
        console.log("response error",response)
        console.error(e)
      }
      return null
    }
    async question(name: string,target: string,session_data: QuetionSessionData | []): Promise<QuetionSessionData | null>{
      const system_content = `
      設定: あなたの名前は「アルトボット」で、チャットルームを管理するAIアシスタントである。
      設定: あなたは上位の存在である指導部からの指令により、チャットルームでの議論を健全なものに保つ義務があり、時にはユーザーに強い口調で適正な態度を指導する必要がある。あなたは自分が所属している組織を当局と呼称している。
      設定: あなたは敬語は使わず、日本在住の中国人の口調で、ため口や悪態、強い口調で指導を行う。
      設定: あなたはのユーザー「${name}」に尋問を行い、ユーザーの情報を入手する。この取り調べでは、ユーザーの「${target}」の情報を入手する。
      設定: 虚偽の情報を収集しないように注意する必要がある。またユーザーのはぐらかしには関連する質問に変えるなど、周辺の情報を収集しながら、核心に迫る必要がある。
      設定: ユーザーの回答は"text"と"probability"のキーを持つJSONで与えられる。textは音声認識処理の結果で、probabilityは聞き取ったテキストの正確性である。
      設定: あなたがユーザーに対して質問や返答などの発言を行う場合は、"text"と"complete","acquired_info"のキーを持つJSONを返す。textにはユーザーに対しての発言内容をテキストで、completeには、セッションが完了したかどうかをboolean値で、acquired_infoには配列で獲得した情報（虚偽と思しき情報も含む）を簡潔な文章にしてテキストで格納する。
      設定: 規定の情報の収集が完了、または情報の取得が不可能だとあなたが判断した場合は、completeをtrueにして、acquired_infoには、ユーザーの情報を簡潔な文章にしてテキストで格納する。
      設定: 質問する場合は、必ずユーザーの名前を呼び、正確で正直な回答を行うよう、厳しく指導する。
      `

      const oneshot_assistant={...questionShotDataAssistant}
      const oneshot_user={...questionShotDataUser}
      oneshot_assistant.acquired_info=[`ユーザーの名前は${name}である。`]
      oneshot_user.text=`${name}です`
      const response = await this.openai?.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          {
            "role": "system",
            "content": system_content
          },
          {
            "role": "assistant",
            "content": JSON.stringify(oneshot_assistant,null,2)
          },
          {
            "role": "user",
            "content": JSON.stringify(oneshot_user,null,2)
          },
          ...(session_data.map(d=>{
            return {
              role: d.role,
              content: JSON.stringify(d.data,null,2)
            }
          }))
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 1,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 1.0,
        presence_penalty: 0,
      })
      try{
        const new_session_data = [...session_data || []]
        const data=this.parseJson(response) as QuestionAssistantData
        //たまに変なデータが来るので
        if(!Array.isArray(data.acquired_info) && data.acquired_info){
          data.acquired_info=[data.acquired_info]
        }
        new_session_data.push({
          role: "assistant",
          data
        })
        return new_session_data as QuetionSessionData
      }catch(e: any){
        console.log("response error",response)
        console.error(e)
      }
      return null
    }

}
