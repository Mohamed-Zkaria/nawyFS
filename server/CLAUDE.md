# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This `server` directory is one half of a monorepo rooted one level up (`../`), which also contains `../client` (a Next.js app, see `../client/CLAUDE.md`). This CLAUDE.md covers `server` only.

## Commands

Run from this directory (`server`):

- `npm run start:dev` — start in watch mode (default port 3000)
- `npm run start:debug` — watch mode with `--inspect-brk`
- `npm run build` — compile via `nest build`
- `npm run start:prod` — run the compiled build (`dist/main`)
- `npm run lint` — ESLint with `--fix` over `src`, `apps`, `libs`, `test`
- `npm run format` — Prettier over `src` and `test`
- `npm test` — Jest unit tests
- `npm run test:watch` — Jest in watch mode
- `npm run test:cov` — Jest with coverage
- `npm run test:e2e` — e2e tests (uses `test/jest-e2e.json` config; spins up a real Postgres via testcontainers — needs Docker running)
- `npm run db:migrate` / `npm run db:seed` — ts-node CLI, reads `DB_*` from `process.env`

Run a single test file: `npm test -- apartments.service.spec.ts` (Jest `rootDir` is `src`, spec files matched by `.*\.spec\.ts$`; e2e specs live in `test/` and run via `test:e2e`).

## Architecture

- NestJS 11 + TypeScript, `strict: true` (no loosening flags). Path alias `@/*` → `src/*` (no `baseUrl`, per `tsconfig.json`'s `paths` — avoids a TS deprecation warning).
- `src/modules/{apartments,projects,users,auth}/` — each follows controller → service → repository-port → TypeORM adapter, with an in-memory adapter for unit tests (see root `README.md` → "Architecture highlights" for the SOLID rationale). `src/config/` — Zod-validated env, `AppConfigService` is the only class that touches `ConfigService`. `src/common/` — the error/success envelope, exception filter, shared DTOs/utils.
- Auth: global `JwtAuthGuard` + `RolesGuard` + `ThrottlerGuard` (secure-by-default — every endpoint needs `@Public()` or it's inaccessible). Seeded admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Apartment images are admin-supplied external URLs (`apartment_images.url`), validated with `@IsUrl()` — there is no file-upload/storage pipeline in this project (see root `README.md` → "Deviations from InitialSystemDesign").
- See root `README.md` for the full API summary, env var tables, and design decisions/tradeoffs.
