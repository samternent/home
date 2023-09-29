FROM node:18-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY ./apps/footballsocial-api /app/apps/footballsocial-api
COPY ./pnpm*.yaml /app
COPY ./package.json /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter footballsocial-api install

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
EXPOSE 3000
CMD [ "pnpm", "--filter", "footballsocial-api", "start" ]
