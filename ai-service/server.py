#!/usr/bin/env python

import sys
from pathlib import Path
sys.path.append(f'{Path(__file__).parent}/MoeGoe')

import os
import grpc
import transcription_pb2
import transcription_pb2_grpc
import tts_pb2
import tts_pb2_grpc
from grpc_reflection.v1alpha import reflection

from services.transcription import Transcription
from services.tts import Tts

import asyncio
import concurrent.futures

_cleanup_coroutines = []

async def serve(port=1234):
    global server
    global _cleanup_coroutines
    server = grpc.aio.server()

    # 様々な処理待ちに使われるスレッドプール
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=32)

    # Serverオブジェクトに定義したServicerクラスを登録する
    transcription_pb2_grpc.add_TranscriptionServicer_to_server(Transcription(pool), server)
    tts_pb2_grpc.add_TtsServicer_to_server(Tts(pool), server)

    SERVICE_NAMES = (
        reflection.SERVICE_NAME,
    )
    SERVICE_NAMES += (transcription_pb2.DESCRIPTOR.services_by_name[Transcription.__name__].full_name,)
    SERVICE_NAMES += (tts_pb2.DESCRIPTOR.services_by_name[Tts.__name__].full_name,)
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    server.add_insecure_port(f"[::]:{port}")
    
    # 待ち受けを開始する
    await server.start()
    print(f"gRPC server started on port {port}",file=sys.stderr)

    async def server_graceful_shutdown():
        print("Starting graceful shutdown...", file=sys.stderr)
        # Shuts down the server with 0 seconds of grace period. During the
        # grace period, the server won't accept new connections and allow
        # existing RPCs to continue within the grace period.
        await server.stop(5)

    _cleanup_coroutines.append(server_graceful_shutdown())

    try:
        await server.wait_for_termination()
    except KeyboardInterrupt:
        # Shuts down the server with 0 seconds of grace period. During the
        # grace period, the server won't accept new connections and allow
        # existing RPCs to continue within the grace period.
        await server.stop(0)
    await server.wait_for_termination()  

if __name__ == "__main__":
    print("Starting gRPC server...", file=sys.stderr)
    loop = asyncio.get_event_loop()
    try:
        # port from environment variable
        port = os.environ.get("PORT", 1234)
        loop.run_until_complete(serve(port))
    finally:
        loop.run_until_complete(*_cleanup_coroutines)
        loop.close()
