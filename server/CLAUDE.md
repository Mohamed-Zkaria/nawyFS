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
- `npm run test:e2e` — e2e tests (uses `test/jest-e2e.json` config)

Run a single test file: `npm test -- app.controller.spec.ts` (Jest `rootDir` is `src`, spec files matched by `.*\.spec\.ts$`; e2e specs live in `test/` and run via `test:e2e`).

## Architecture

- NestJS 10 + TypeScript, currently the unmodified `nest new` scaffold: `src/main.ts` bootstraps `AppModule`; `src/app.module.ts` wires the single root `AppController`/`AppService`. No other modules, controllers, providers, database, or config layer exist yet.
- `tsconfig.json` has `strictNullChecks: false` and `noImplicitAny: false` (Nest CLI defaults) — do not assume strict-mode guarantees.
- Path root is `src` (`nest-cli.json` `sourceRoot`); `tsconfig.json` `baseUrl` is `./` with no path aliases configured.
