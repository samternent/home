FROM node:18-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY ./apis/concords /app

FROM base AS prod-deps
# Lockfile should be frozen but I can't figure it out. this is bad.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
EXPOSE 4002
CMD [ "pnpm", "--filter", "concords-api", "start" ]
