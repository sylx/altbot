#!/usr/bin/env python

import sys
from pathlib import Path
sys.path.append(f'{Path(__file__).parent}/MoeGoe')

# gRPCのサーバー実装ではThreadPoolを利用する
from concurrent.futures import ThreadPoolExecutor

# 「grpc」パッケージと、grpc_tools.protocによって生成したパッケージをimportする
import grpc
import transcription_pb2
import transcription_pb2_grpc
import tts_pb2
import tts_pb2_grpc

# grpc reflection用の追加ライブラリ
from grpc_reflection.v1alpha import reflection

from services.transcription import Transcription
from services.tts import Tts

from memory_profiler import profile

def manager():
    # Serverオブジェクトを作成する
    server = grpc.server(ThreadPoolExecutor(max_workers=2))

    # Serverオブジェクトに定義したServicerクラスを登録する
    transcription_pb2_grpc.add_TranscriptionServicer_to_server(Transcription(), server)
    tts_pb2_grpc.add_TtsServicer_to_server(Tts(), server)

    # [追記] リフレクション登録
    SERVICE_NAMES = (
        reflection.SERVICE_NAME,
    )
    SERVICE_NAMES += (transcription_pb2.DESCRIPTOR.services_by_name[Transcription.__name__].full_name,)
    SERVICE_NAMES += (tts_pb2.DESCRIPTOR.services_by_name[Tts.__name__].full_name,)
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    # 1234番ポートで待ち受けするよう指定する
    server.add_insecure_port("[::]:1234")
    
    # 待ち受けを開始する
    server.start()

    # 待ち受け終了後の後処理を実行する
    server.wait_for_termination()

if __name__ == "__main__":
    manager()