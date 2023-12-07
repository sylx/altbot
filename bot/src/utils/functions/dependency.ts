import assert from "assert";
import { F } from "ts-toolbelt";
import { container, injectable, InjectionToken, Lifecycle, scoped } from "tsyringe";

export interface IGuildDependent {
    getGuildId(): string | null
}

export const resolveDependency = async <T>(token: InjectionToken<T>, interval: number = 500): Promise<T> => {

    while (!container.isRegistered(token, true)) {
        await new Promise(resolve => setTimeout(resolve, interval))
    }

    const instance = container.resolve(token)
    //instanceがIGuildDependentを実装していた場合、resolveDependencyPerGuildを使用すべきだが、TSの型システムでは検知できないので、assertで弾く
    assert(!(instance instanceof Object && 'getGuildId' in instance),
    `Instance you created implements IGuildDependent,you should use resolveDependencyPerGuild`)
    return instance
}

const containerPerGuild = new Map<string, typeof container>()

export const resolveDependencyPerGuild = async <T>(token: InjectionToken<T & IGuildDependent>, guildId: string, interval: number = 500): Promise<T & IGuildDependent> => {

    if (!containerPerGuild.has(guildId)) {
        containerPerGuild.set(guildId, container.createChildContainer())
    }

    const childContainer = containerPerGuild.get(guildId)!

    while (!childContainer.isRegistered(token, true)) {
        await new Promise(resolve => setTimeout(resolve, interval))
    }

    const instance = childContainer.resolve(token)
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

// ギルド別のコンポーネントであることを示すデコレーター
export function guildScoped() {
    // injectableとscopedを組み合わせる
    return (target: any) => {
        injectable()(target); // コンポーネントとして登録する
        scoped(Lifecycle.ContainerScoped)(target); // コンテナごとにインスタンスを生成する
        return target
    };
  }
  