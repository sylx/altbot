import { Entity, EntityRepositoryType, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core"
import { EntityManager, EntityRepository } from "@mikro-orm/sqlite"

import { CustomBaseEntity } from "./BaseEntity"
import { resolveDependency } from "@utils/functions"
import { Gpt } from "@services"
import { GuildMember } from "discord.js"
import { NgWord } from "./NgWord"
import { U } from "ts-toolbelt"

@Entity({ customRepository: () => NgWordHistoryRepository })

export class NgWordHistory extends CustomBaseEntity {

    [EntityRepositoryType]?: NgWordHistoryRepository

    @PrimaryKey()
    id: number

    @Property()
    member_id: string

    @Property()
    hit_word: string

    @Property()
    hit_score: number

    @ManyToOne(() => NgWord)
    ngword: NgWord
}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export interface UserStatistics {
    member_id: string
    total_count: number
    total_score: number
}

export class NgWordHistoryRepository extends EntityRepository<NgWordHistory> {
    async addHistory(member_id: string, hit_word: string,ngword: NgWord): Promise<NgWordHistory> {
        const row = new NgWordHistory()
        row.member_id = member_id
        row.ngword = ngword
        row.hit_word = hit_word
        row.hit_score = ngword.score
        await this.getEntityManager().persistAndFlush(row)
        return row
    }
    async getRecentHistory(member_id: string,limit: number): Promise<NgWordHistory[]> {
        const rows = await this.find({
            member_id
        },{
            orderBy: {
                id: 'DESC'
            },
            limit
        })
        return rows
    }
    async getStatisticsByMember(member_id: string): Promise<UserDetailStatistics> {
        const em=this.getEntityManager() as EntityManager
        const query=em.createQueryBuilder(NgWordHistory,"h")
                .select(["h.member_id","count(h.id) as total_count","sum(h.hit_score) as total_score"])
        const rows=await query.execute() as UserStatistics[]
        return {
            member_id,
            total_count: rows[0].total_count,
            total_score: rows[0].total_score
        }
    }

    async getStatistics(): Promise<UserStatistics[]> {
        const em=this.getEntityManager() as EntityManager
        const query=em.createQueryBuilder(NgWordHistory,"h")
                .select(["h.member_id","count(h.id) as total_count","sum(h.hit_score) as total_score"])
                .groupBy("h.member_id")
        return await query.execute() as UserStatistics[]
    }
}