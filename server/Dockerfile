# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---- deps: full install (incl. devDependencies), used only to build ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript -> dist ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod-deps: runtime-only install, no TypeORM CLI / Nest CLI / etc ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runner: the shipped image ----
FROM base AS runner
ENV NODE_ENV=production

USER node

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

EXPOSE 4000

# Alpine ships neither curl nor wget — Node's global fetch is the
# healthcheck tool here. /health is @Public() and excluded from the
# global API prefix, so this hits the bare path.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form: node is PID 1 and receives SIGTERM directly, which
# app.enableShutdownHooks() (bootstrap.ts) needs to fire on.
CMD ["node", "dist/main.js"]
