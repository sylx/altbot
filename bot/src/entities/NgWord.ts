import { Entity, EntityRepositoryType, PrimaryKey, Property } from "@mikro-orm/core"
import { EntityRepository } from "@mikro-orm/sqlite"

import { CustomBaseEntity } from "./BaseEntity"
import { resolveDependency } from "@utils/functions"
import { Gpt } from "@services"
import { GuildMember } from "discord.js"

@Entity({ customRepository: () => NgWordRepository })

export class NgWord extends CustomBaseEntity {

    [EntityRepositoryType]?: NgWordRepository

    @PrimaryKey()
    id: number

    @Property()
    words: string[]

    @Property()
    score: number

    @Property()
    gentle_reactions: string[]

    @Property()
    normal_reactions: string[]

    @Property()
    guilty_reactions: string[]

    @Property()
    count: number = 0

    @Property()
    createdBy: string | null
}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class NgWordRepository extends EntityRepository<NgWord> {
    async getNgWords(): Promise<string[]> {
        const rows = await this.findAll()
        return rows.flatMap(row => row.words)
    }
    async getReactions(word: string): Promise<NgWord | null> {
        return await this.findOne({
            words: new RegExp(word)
        })
    }
    async addNgWord(word: string,score: number,member: GuildMember | undefined): Promise<NgWord> {
        const gpt = await resolveDependency(Gpt)
        const response = await gpt.makeNgWord(word)
        if (response === null) throw new Error("AIの生成中に何らかのエラーがありました")        

        const row = new NgWord()
        row.words = [word,...response.synonyms]
        row.score = score
        row.gentle_reactions = response.gentle_reactions
        row.normal_reactions = response.normal_reactions
        row.guilty_reactions = response.guilty_reactions
        row.createdBy = member ? member.id : null
        row.count = 0

        await this.getEntityManager().persist(row).flush()
        return row
    }
}