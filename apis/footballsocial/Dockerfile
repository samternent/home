FROM node:18-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter footballsocial-api --frozen-lockfile
RUN --mount=type=secret,id=VITE_PUBLIC_SUPABASE_URL \
  --mount=type=secret,id=VITE_PUBLIC_SUPABASE_ANON_KEY \
  --mount=type=secret,id=VITE_PUBLIC_SUPABASE_SUPER_KEY \
  --mount=type=secret,id=REDIS_PASSWORD \
  --mount=type=secret,id=REDIS_ENDPOINT_URI \
  --mount=type=secret,id=FOOTBALL_DATA_API_KEY \
  --mount=type=secret,id=OPENAPI_KEY \
  export VITE_PUBLIC_SUPABASE_URL=$(cat /run/secrets/VITE_PUBLIC_SUPABASE_URL) && \
  export VITE_PUBLIC_SUPABASE_ANON_KEY=$(cat /run/secrets/VITE_PUBLIC_SUPABASE_ANON_KEY) && \
  export VITE_PUBLIC_SUPABASE_SUPER_KEY=$(cat /run/secrets/VITE_PUBLIC_SUPABASE_SUPER_KEY) && \
  export REDIS_PASSWORD=$(cat /run/secrets/REDIS_PASSWORD) && \
  export REDIS_ENDPOINT_URI=$(cat /run/secrets/REDIS_ENDPOINT_URI) && \
  export FOOTBALL_DATA_API_KEY=$(cat /run/secrets/FOOTBALL_DATA_API_KEY) && \
  export OPENAPI_KEY=$(cat /run/secrets/OPENAPI_KEY)

FROM base
# COPY --from=prod-deps /app/node_modules /app/node_modules
EXPOSE 4002
CMD [ "pnpm", "--filter", "footballsocial-api", "start" ]
