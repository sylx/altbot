# [Choice] Python version (use -bookworm or -bullseye variants on local arm64/Apple Silicon): 3, 3.11, 3.10, 3.9, 3.8, 3-bookworm, 3.11-bookworm, 3.10-bookworm, 3.9-bookworm, 3.8-bookworm, 3-bullseye, 3.11-bullseye, 3.10-bullseye, 3.9-bullseye, 3.8-bullseye, 3-buster, 3.11-buster, 3.10-buster, 3.9-buster, 3.8-buster
ARG VARIANT=3.8.18-slim-bullseye
FROM python:${VARIANT}

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    # Remove imagemagick due to https://security-tracker.debian.org/tracker/CVE-2019-10131
    && apt-get purge -y imagemagick imagemagick-6-common 

# Temporary: Upgrade python packages due to https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-40897
# They are installed by the base image (python) which does not have the patch.
RUN python3 -m pip install --upgrade setuptools

ENV INSTALLCUDNN true
ENV INSTALLNVTX true
ENV CUDAVERSION "11.8"
ENV CUDNNVERSION "8.6.0.163"

COPY install_cuda.sh /usr/local/bin/
RUN /usr/local/bin/install_cuda.sh

# for requirements.txt
RUN apt update && apt install -y build-essential cmake libopus-dev
RUN pip install --upgrade pip
# install torch cuda11.8
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
# espnetのprotobuf<=3.20.1を無視したいのだけど、requirements.txtに書いてあるので、一旦それ以外をコピーしてからespnetをインストールする
COPY requirements.txt /tmp/
RUN grep -v '^espnet' /tmp/requirements.txt > /tmp/requirements_no_espnet.txt
RUN pip install -r /tmp/requirements_no_espnet.txt
RUN pip install --no-deps espnet==202308 espnet-tts-frontend==0.0.3
RUN python -munidic download
RUN pip cache purge && apt-get clean