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

There is no client test suite yet (see root `README.md` → "What's next").

## Architecture

- Next.js 16 App Router project (`src/app/`), TypeScript, React 19, Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config`—Tailwind v4 is configured through `globals.css`).
- Path alias: `@/*` maps to `./src/*` (see `tsconfig.json`).
- `output: "standalone"` in `next.config.ts` (Docker image size).
- Public routes: `/apartments` (listing, search/filter/sort/pagination), `/apartments/[id]` (detail + gallery). Admin routes: `/login`, `/admin/apartments` (list/create/edit/delete), gated by `app/admin/layout.tsx` reading an httpOnly session cookie server-side.
- Server Components by default; `'use client'` only at interactive leaves (`SearchFilters`, `ApartmentGallery`, forms). Admin mutations go through React 19 `useActionState` + Server Actions (`app/admin/_actions/apartments.ts`, `app/login/actions.ts`) — no client-side fetch layer for the API at all.
- `lib/api/` — typed API client (`server-only`, never reaches a client bundle); `lib/auth/` — session cookie + current-user helpers.
- Apartment images are admin-supplied external URLs (see root `README.md` → "Deviations"), not local/uploaded files — `next/image` is used with `unoptimized` for them, since arbitrary hostnames can't satisfy `images.remotePatterns` at build time (see `lib/utils/is-external-url.ts`).
- See root `README.md` for the full architecture writeup, env vars, and design decisions.

## Notes

- `node_modules/next` regenerates an `AGENTS.md` block on `next dev` documenting that this Next.js version may have breaking API changes versus training data; consult `node_modules/next/dist/docs/` for the current version's APIs before assuming standard Next.js conventions.
