class MyClass {
    private eventHandlers: { [event: string]: Array<(data: any) => void> } = {};

    public on(event: string, handler: (data: any) => void) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    public emit(event: string, data: any) {
        const handlers = this.eventHandlers[event];
        if (handlers) {
            for (const handler of handlers) {
                handler(data);
            }
        }
    }

    public async *dataGenerator(): AsyncGenerator<number, void, unknown> {
        while (true) {
            yield new Promise<number>((resolve) => {
                this.on('data', (data) => {
                    resolve(data);
                });
            });
        }
    }
}

async function sleep(ms: number) : Promise<void>{
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function main(){
    const myInstance = new MyClass();

    (async () => {
        for await (const data of myInstance.dataGenerator()) {
            console.log(data);
        }
    })();
    

    myInstance.emit('data', 123);
    await sleep(500);
    myInstance.emit('data', 456);
    await sleep(500);
    myInstance.emit('data', 789);
}

main()