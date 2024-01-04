export function PromiseAllDynamic<T>(promises: Promise<T>[]): Promise<T[]> {
    return new Promise(resolve => {
      const wait = () => {
        const length = promises.length
        Promise.all(promises).then(data => {
          if (length == promises.length)
            resolve(data)
          else
            wait()
        })
      }
      wait()
    })
  }
  