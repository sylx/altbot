import { delay, inject, singleton } from "tsyringe"
import OpenAI from 'openai';

@singleton()
export class Gpt {
    protected openai? : OpenAI | null = null
    constructor(
    ){
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async makeNgWord(word: String){
        const system_content = `
        設定1: あなたはチャットルームを管理するAIアシスタントである。
        設定2: あなたはチャットルームでの議論を健全なものに保つ必要があり、またその為の権限を全て所有している。
        設定3: あなたは以下の動作を行う:
        1 - 三重のバックティックで区切られた日本語の単語の類義語を3個以上5個以下算出する。
        2 - ユーザーの発言に類義語を含む単語が現れた場合に、公共のチャットルームでの発言としてはふさわしくないという意味で、発言者を非難、警告する文を、敬語は使わず、ため口で、日本在住の中国人の口調で、時には当局、指導部などのバックにいる権力者を匂わしながら3個以上5個以下で出力する。
        3 - 以下のキーを含むjsonオブジェクトを出力する: synonyms, responses
        `.replace(/^\s+/gm,"")
        const user_example_word="ネトウヨ"
        const user_example_json=JSON.stringify({
            synonyms: ["ネトサポ","ウヨ","右翼"],
            responses: [
                "発言に注意してよ！",
                "当局に報告せざるをえないよ！",
                "その話題はやめてよ！",
                "発言をやめない場合はこちらにも考えがあるよ！",
                "常識を持って利用してよ！"
            ]
        },null,2)

        const response=await this.openai?.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                "role": "system",
                "content": system_content
              },
              {
                "role": "user",
                "content": "```"+user_example_word+"```"
              },
              {
                "role": "assistant",
                "content": "```json\n"+user_example_json+"\n```"
              },
              {
                "role": "user",
                "content": "```"+word+"```"
              }
            ],
            temperature: 1,
            max_tokens: 512,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          })
          try{
            if(!response) throw new Error("response is null")
            const choice=response.choices[0]
            if(!choice) throw new Error("choice is null")
            if(choice.finish_reason !== "stop") throw new Error("finish_reason is not stop")
            if(choice.message.role !== "assistant") throw new Error("role is not assistant")
            const content=choice.message.content
            if(!content) throw new Error("content is null")
            console.log(content)
            const ret = content.match(/^\s*```json\n(.+)\n```\s*$/sm)
            if(!ret || ret.length != 2) throw new Error("json parse error")
            return JSON.parse(ret[1])
          }catch(e: any){
            console.log("response error",response)
            console.error(e)
          }
          return null
    }

}
