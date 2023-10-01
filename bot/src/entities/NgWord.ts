import { Entity, EntityRepositoryType, PrimaryKey, Property } from "@mikro-orm/core"
import { EntityRepository } from "@mikro-orm/sqlite"

import { CustomBaseEntity } from "./BaseEntity"

@Entity({ customRepository: () => NgWordRepository })

export class NgWord extends CustomBaseEntity {

    [EntityRepositoryType]?: NgWordRepository

    @PrimaryKey()
    id: number

    @Property()
    words: string

    @Property()
    reactions: string    
}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class NgWordRepository extends EntityRepository<NgWord> {
    async getNgWords(): Promise<string[]> {
        const rows = await this.findAll()
        return rows.flatMap(row => row.words.split(','))
    }
    async getReactions(word: string): Promise<[string[],number[]]> {
        const rows = await this.find({
            words: new RegExp(word)
        })
        return [
            rows.flatMap(row => row.reactions.split(',')),
            rows.map(row => row.id)
        ]
    }
    async addNgWord(words: string[], reactions: string[]): Promise<NgWord> {
        const row = new NgWord()
        row.words = words.join(',')
        row.reactions = reactions.join(',')
        await this.getEntityManager().persist(row).flush()
        return row
    }
}