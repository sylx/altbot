## build runner
ARG VARIANT=18.13.0-bullseye-slim
FROM node:${VARIANT}

RUN apt update && apt install -y build-essential cmake libopus-dev curl
# Rustをインストール
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# 環境変数を設定（cargoへのパスを追加）
ENV PATH="/root/.cargo/bin:${PATH}"

# Set temp directory
WORKDIR /app

# Move package.json and package-lock.json
COPY package.json .
COPY package-lock.json .
COPY src ./src
COPY grpc ./grpc

# Install dependencies from package-lock.json
# and install dependencies for plugins (because postinstall script doesn't work in docker)
RUN npm ci

COPY .swcrc .
COPY tsconfig.json .

# Build project
RUN npm run build

# set production mode
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# Set work directory
WORKDIR /app

RUN npm cache clean --force 

# Finaly start the bot
CMD ["node", "build/main.js"]