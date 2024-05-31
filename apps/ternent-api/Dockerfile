FROM node:18-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY ./apps/ternent-api /app

FROM base AS prod-deps
# Lockfile should be frozen but I can't figure it out. this is bad.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Install FFmpeg. This is needed to convert the video to HLS
RUN apk add --no-cache ffmpeg

# /usr/bin/ffmpeg is the default path for ffmpeg, copy it to /app
RUN cp /usr/bin/ffmpeg ./

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
EXPOSE 3000
EXPOSE 3001
EXPOSE 1935
CMD [ "pnpm", "--filter", "ternent-api", "start" ]
