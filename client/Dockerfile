# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Zero build args on purpose — no NEXT_PUBLIC_*, no API URL baked in here.
# next.config.ts sets output: "standalone"; every env var this app reads
# (API_INTERNAL_URL, API_TIMEOUT_MS) is server-only and read at request
# time by the running server, never inlined at build time.
RUN npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN chown -R node:node /app
USER node

# server.js does NOT copy public/ or .next/static on its own — forgetting
# either of these two lines is the #1 "CSS and images are broken in
# Docker" bug.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
