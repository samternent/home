FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.node.json ./
COPY scripts ./scripts
COPY packages ./packages
COPY apps/ternent-api ./apps/ternent-api

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

FROM base AS prod-deps
# Lockfile should be frozen but I can't figure it out. this is bad.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter ternent-api... --no-frozen-lockfile

# Build dependent libs
RUN pnpm run build:ternent-api-libs
RUN pnpm run generate:pixpax:all

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules

# /usr/bin/ffmpeg is the default path for ffmpeg, copy it to /app
RUN cp /usr/bin/ffmpeg ./

EXPOSE 3000

CMD [ "pnpm", "--filter", "ternent-api", "start" ]
