# LenaQar marketplace — production image for the Hostinger VPS.
# Multi-stage standalone build: deps -> build -> slim runner.
#
# Env at BUILD time: pass the production env file as a BuildKit secret so
# NEXT_PUBLIC_* are inlined and prerendered pages can call the backend,
# without any value landing in an image layer:
#   docker build --secret id=env,src=/opt/lenaai/secrets/lenaqar.env \
#     --build-arg GIT_SHA=<sha> -t lenaqar-web:<tag> .
# Env at RUN time: compose `env_file:` (server-only values such as X_API_KEY).

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts=false --include=optional

FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` loads .env.production; it exists only for this RUN step.
RUN --mount=type=secret,id=env,target=/app/.env.production \
    npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ARG GIT_SHA=unknown
ARG BUILT_AT=unknown
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=512 \
    GIT_SHA=$GIT_SHA \
    BUILT_AT=$BUILT_AT
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Guides + project snapshot are read from process.cwd() at runtime.
COPY --from=build --chown=node:node /app/content ./content
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/version').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
