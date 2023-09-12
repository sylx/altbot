
import * as grpc from "@grpc/grpc-js"
import { delay, inject, singleton } from "tsyringe"
import { TranscriptionClient } from "../../grpc/transcription_grpc_pb"

@singleton()
export class Transcription {
    public client : TranscriptionClient
    constructor(
    ) {
        this.client=new TranscriptionClient(
            "localhost:1234",
            grpc.credentials.createInsecure()
          )
    }
    getClient() : TranscriptionClient{
        return this.client
    }
}
