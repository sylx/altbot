import assert from "assert";
import exp from "constants"
import { F } from "ts-toolbelt"
import { container, InjectionToken } from "tsyringe"

export interface IGuildDependent {
    setGuildId(id: string): void;
}

export const resolveDependency = async <T>(token: InjectionToken<T>, interval: number = 500): Promise<T> => {

    while (!container.isRegistered(token, true)) {
        await new Promise(resolve => setTimeout(resolve, interval))
    }

    const instance = container.resolve(token)
    //instanceがIGuildDependentを実装していたらエラー
    assert(!(instance instanceof Object && 'setGuildId' in instance))
    return instance
}

const containerPerGuild = new Map<string, typeof container>()

export const resolveDependencyPerGuild = async <T extends IGuildDependent>(token: InjectionToken<T>, guildId: string, interval: number = 500): Promise<T> => {

    if (!containerPerGuild.has(guildId)) {
        containerPerGuild.set(guildId, container.createChildContainer())
    }

    const childContainer = containerPerGuild.get(guildId)!

    while (!childContainer.isRegistered(token, true)) {
        await new Promise(resolve => setTimeout(resolve, interval))
    }

    const instance=childContainer.resolve(token)
    instance.setGuildId(guildId)
    return instance
}


type Forward<T> = {[Key in keyof T]: T[Key] extends abstract new (...args: any) => any ? InstanceType<T[Key]> : T[Key]}

export const resolveDependencies = async <T extends readonly [...unknown[]]>(tokens: F.Narrow<T>) => {

    return Promise.all(tokens.map((token: any) => 
        resolveDependency(token)
    )) as Promise<Forward<F.Narrow<T>>>
}

export const resolveDependenciesPerGuild = async <T extends readonly [...unknown[]]>(guildId: string, tokens: F.Narrow<T>) => {
    return Promise.all(tokens.map((token: any) => 
        resolveDependencyPerGuild(token, guildId)
    )) as Promise<Forward<F.Narrow<T>>>
}