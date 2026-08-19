# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a two-project monorepo with no root `package.json` or shared tooling — `client` and `server` are independent projects, each with its own dependencies, lint config, and commands. Always `cd` into the relevant directory before running any command; nothing runs from the repo root.

- `client/` — Next.js 16 (App Router) + TypeScript + Tailwind v4 frontend. See `client/CLAUDE.md` for commands and architecture.
- `server/` — NestJS 10 + TypeScript API. See `server/CLAUDE.md` for commands and architecture.

Both are currently unmodified scaffolds (`create-next-app` / `nest new`) with no integration between them yet — no shared API contract, no cross-project conventions established.
