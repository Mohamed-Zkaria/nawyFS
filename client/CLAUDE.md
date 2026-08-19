# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This `client` directory is one half of a monorepo rooted one level up (`../`), which also contains `../server` (a NestJS API). This CLAUDE.md covers `client` only; `server` has its own conventions (NestJS + ESLint/Prettier, not covered here).

## Commands

Run from this directory (`client`):

- `npm run dev` — start the Next.js dev server (Turbopack, default port 3000)
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`)

There is no test setup configured yet.

## Architecture

- Next.js 16 App Router project (`src/app/`), TypeScript, React 19, Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config`—Tailwind v4 is configured through `globals.css`).
- Path alias: `@/*` maps to `./src/*` (see `tsconfig.json`).
- Currently the app is the unmodified `create-next-app` scaffold: `src/app/layout.tsx` (root layout, Geist fonts) and `src/app/page.tsx` (default landing page). There is no routing, state management, data-fetching, or component structure established yet — these will need to be introduced as the app is built out.

## Notes

- `node_modules/next` regenerates an `AGENTS.md` block on `next dev` documenting that this Next.js version may have breaking API changes versus training data; consult `node_modules/next/dist/docs/` for the current version's APIs before assuming standard Next.js conventions.
