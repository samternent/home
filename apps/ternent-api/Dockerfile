FROM node:18-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY ./apps/ternent-api /app

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

FROM base AS prod-deps
# Lockfile should be frozen but I can't figure it out. this is bad.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules

# /usr/bin/ffmpeg is the default path for ffmpeg, copy it to /app
RUN cp /usr/bin/ffmpeg ./

EXPOSE 3000
EXPOSE 3001

CMD [ "pnpm", "--filter", "ternent-api", "start" ]
