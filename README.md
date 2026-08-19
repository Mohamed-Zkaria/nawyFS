# Nawy Apartments

A full-stack apartment listing app: a NestJS + TypeScript API, a Next.js
frontend, PostgreSQL, and an admin panel for managing listings — all
runnable with one command.

## Quickstart

```bash
git clone 
cd nawyFS
docker compose up --build
```

That's it — no `.env` file to create, no manual migration step. On a clean
clone this brings up Postgres, runs migrations + seed, and starts both
services:

- **Web** — http://localhost:3000
- **API** — http://localhost:4000/api/v1, Swagger UI at http://localhost:4000/api/docs
- **Health** — http://localhost:4000/health (checks DB connectivity)

**Seeded admin login** (for the admin panel at http://localhost:3000/login):

```
admin@nawy.local / ChangeMe_Admin123!
```

The stack seeds ~8 projects and ~60 apartments so the listing/search/filter
pages aren't empty on first run. To stop and remove everything (including
the database volume): `docker compose down -v`.

## What's here

Two independent projects — see their own `CLAUDE.md`/`README.md` for
per-project commands:

- **`server/`** — NestJS 11 API, TypeORM + PostgreSQL, JWT auth.
- **`client/`** — Next.js 16 (App Router), React 19, Tailwind v4.
- **`InitialSystemDesign/`** — the original ERD + sequence diagrams, updated
  to match what shipped (see "Deviations" below).

Nothing shares tooling — always `cd` into the project you're working in.

## Features

- **Public**: apartment listing (paginated), search by unit name / unit
  number / project name, filter by project/price/bedrooms, sort, apartment
  detail page with an image gallery. Fully responsive.
- **Admin** (JWT-authenticated, httpOnly cookie session): login, apartment
  list, create/edit/delete apartments, add/remove images by URL.
- Everything in the admin panel is also reachable directly against the API
  (see Swagger) — the panel is a convenience layer, not the source of truth
  for authorization (the API's guards are).

## API summary

Base path `/api/v1` unless noted. Success responses are `{ data }` or
`{ data, meta }`; errors are `{ statusCode, error: { code, message, ... } }`
with a machine-readable `code` (see `server/src/common/constants/error-codes.ts`).

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/apartments` | public | `page`, `limit`, `search`, `projectId`, `minPrice`, `maxPrice`, `bedrooms`, `sortBy`, `sortOrder` |
| GET | `/apartments/:id` | public | 404 if missing/deleted |
| POST | `/apartments` | admin | exactly one of `projectId` or `projectName`+`projectCity` |
| PATCH | `/apartments/:id` | admin | partial update, any subset of fields |
| DELETE | `/apartments/:id` | admin | soft delete (204) |
| POST | `/apartments/:id/images` | admin | `{ urls: string[] }`, each validated as a URL |
| DELETE | `/apartments/:id/images/:imageId` | admin | 204 |
| GET | `/projects` | public | for the project filter dropdown |
| POST | `/auth/register` | public | always creates a `normal`-role user |
| POST | `/auth/login` | public | identical 401 body for unknown-email vs wrong-password |
| GET | `/auth/me` | bearer | |
| GET | `/health` | public, unversioned | DB-aware — returns 503 if Postgres is unreachable |

Full request/response shapes, DTOs, and try-it-out are in Swagger
(`/api/docs`) — every DTO is documented via `@nestjs/swagger`'s CLI plugin.

## Architecture highlights

**Repository ports & adapters.** Every aggregate (`Apartment`, `Project`,
`User`) is accessed through an abstract class as its DI token (e.g.
`ApartmentRepositoryPort`), with one TypeORM adapter and one in-memory test
double. Services depend on the port, never on TypeORM directly — this is
what makes `apartments.service.spec.ts` a real unit test suite with zero
database, and it's the concrete proof of the SOLID claims below.

- **SRP** — controller (HTTP) / service (use case) / repository
  (persistence) / mapper (wire shape) are four separate files with four
  separate reasons to change.
- **OCP** — a hypothetical second `ProjectRepositoryPort` implementation is
  a new class + one `useClass` line; `ApartmentsService` doesn't change.
- **LSP** — `InMemoryApartmentRepository` and `TypeOrmApartmentRepository`
  are interchangeable behind the same port; the unit suite is the proof.
- **ISP** — each port exposes only the handful of methods its service
  actually calls, not TypeORM's full `Repository<T>` surface.
- **DIP** — services depend on an abstraction the domain module owns; the
  TypeORM detail depends on that same abstraction, not the other way round.

**Config.** `AppConfigService` is the only class that injects
`ConfigService` — every env var is Zod-validated once (`env.validation.ts`)
and exposed as typed groups (`cfg.db`, `cfg.jwt`, `cfg.cors`, ...). No
`configService.get('SOME_STRING')` anywhere else in the codebase.

**Client.** Server Components by default; `'use client'` only at
interactive leaves (search filters, forms, the image gallery). The admin
panel uses React 19 `useActionState` + Server Actions that read the session
cookie, call the API with a bearer token, and `revalidatePath()` — no
client-side fetch layer for admin mutations at all.

**Auth.** JWT (`sub`/`email`/`role` payload, no per-request DB lookup),
global `JwtAuthGuard` + `RolesGuard` (secure-by-default: every endpoint
needs an explicit `@Public()` or it's inaccessible), bcrypt behind a
`PasswordHasher` port. The browser never sees the JWT directly — the admin
panel stores it in an httpOnly cookie set by a Next.js Server Action, never
`localStorage`.

**Search (bonus feature).** Postgres trigram indexes
(`pg_trgm`/`gin_trgm_ops`) on `unit_name`, `unit_number`, and
`projects.name`, queried with `ILIKE '%term%'` (LIKE metacharacters
escaped). Trigram, not full-text search, because FTS is lexeme/prefix-based
and can't match infixes like `"A-1"` — exactly the kind of query a search
box over short identifiers needs. At seed scale (~60 rows) Postgres
sequential-scans regardless; the index is for correctness of intent, not a
measured performance win.

## Deviations from `InitialSystemDesign/`

The original diagrams (`erd.md` now updated; sequence diagrams still
reflect original intent) predate several decisions made while building:

- **`projects` is a normalized table**, not a string column on `apartments`
  — referential integrity, and the search/filter-by-project feature needs
  it. `erd.md` is updated; the sequence diagrams' high-level flow is
  unaffected.
- **Images are admin-supplied external URLs, not uploaded files.** The
  original design assumed a file-upload pipeline (multipart endpoint,
  server-side storage, a `storage_key`/`mime_type`/`size_bytes` schema).
  That entire pipeline — `StorageService`, local-disk/S3 adapters, Multer
  config, magic-byte validation, static file serving — was deliberately cut
  in favor of `POST /apartments/:id/images` taking `{ urls: string[] }`,
  each validated with `@IsUrl()`. `apartment_images` now just carries
  `url` + `sort_order`. This is simpler, needs zero storage infrastructure
  (no upload volume, no CORP header dance for cross-origin `<img>`), and
  matches the actual admin workflow of pasting a link to an already-hosted
  photo. The tradeoff: no local persistence of the image itself — if the
  external URL goes away, so does the image. Documented, not hidden.
- **`/api/users/*` → `/api/v1/auth/*`** — auth is a distinct concern from
  user management, and versioning was added project-wide.
- **`PUT` → `PATCH`** for updates — the update flow sends a partial field
  set, which is `PATCH` semantics, not a full-resource replacement.
- **Soft delete**, not `DELETE FROM` — `deleted_at` is set so any
  referenced data survives; `adminSeuqenceDeleteApartment.md`'s literal
  `DELETE FROM` doesn't reflect this, but the request/response shape in
  that diagram is still accurate (204, no body).

## Design decisions worth knowing

- **`docker-compose.yml` has a dedicated `migrator` service** (one-shot
  `migrate && seed`, gated on `db: service_healthy`, and `api` is gated on
  `migrator: service_completed_successfully`) rather than
  `migrationsRun: true` on the API — migrations finish before the API
  accepts a single request, the ordering is visible in `docker compose
  logs`, and it doesn't race a hypothetical multi-replica `api`.
- **Zero `NEXT_PUBLIC_*` env vars.** Every value the client needs
  (`API_INTERNAL_URL`, session cookie settings) is read server-side, at
  request time, by Server Components and Server Actions — nothing is baked
  into the browser bundle at build time. This is what makes the same
  client image work in dev, in `docker compose`, and in any future
  deployment without a rebuild.
- **Rate limiting**: two named throttlers (`@nestjs/throttler`) — a
  generous global default and a tighter bucket that only `/auth/*` is
  actually subject to (every other controller opts out with
  `@SkipThrottle({ auth: true })`, since a named throttler checks every
  route by default). Both limits are env-driven and raised automatically
  in `NODE_ENV=test` so the e2e suite's dozens of auth requests in a few
  seconds don't 429 themselves — see `env.validation.ts`.
- **Health check is DB-aware**, not a static `{status: 'ok'}` — it runs
  `SELECT 1` and returns 503 if that fails, which is what Docker's
  `HEALTHCHECK` (and any real orchestrator) actually needs to detect a
  broken dependency instead of a broken process.
- **CORS + helmet** are on by default; `CORS_ORIGINS` is env-driven (comma
  separated). In this app's actual architecture the browser never calls the
  API cross-origin (everything goes through Server Components/Actions), so
  this mostly matters for direct API access and Swagger — but it's the
  correct default regardless of what today's frontend happens to use.

## Environment variables

Every var has a working default for local dev — `server/.env.example` and
`server/.env.docker` are both committed. `server/.env.docker` is what
`docker-compose.yml` feeds the `api`/`migrator` containers; the app's own
env schema still refuses insecure defaults when `NODE_ENV=production`.

**Server** (`server/.env.example`) — grouped by concern:

| Group | Vars |
|---|---|
| App | `NODE_ENV`, `PORT`, `HOST`, `API_GLOBAL_PREFIX`, `API_DEFAULT_VERSION` |
| Logging / docs | `LOG_LEVEL`, `LOG_PRETTY`, `SWAGGER_ENABLED`, `SWAGGER_PATH` |
| Database | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `DB_LOGGING`, `DB_POOL_MAX` |
| CORS / rate limiting | `CORS_ORIGINS`, `CORS_CREDENTIALS`, `RATE_LIMIT_TTL_MS`, `RATE_LIMIT_LIMIT`, `AUTH_RATE_LIMIT_LIMIT` |
| Auth | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_ISSUER`, `BCRYPT_SALT_ROUNDS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

**Client** (`client/.env.example`) — all server-side only, never inlined:

| Var | Purpose |
|---|---|
| `API_INTERNAL_URL` | Where Server Components/Actions call the API (`http://api:4000/api/v1` in compose) |
| `API_TIMEOUT_MS` | Fetch timeout for API calls |
| `SESSION_COOKIE_NAME` | httpOnly admin session cookie name |
| `SESSION_COOKIE_SECURE` | Must be `true` behind HTTPS in any real deployment |

## Testing

```bash
# server/
npm test              # unit tests (Jest, in-memory repos — no DB)
npm run test:e2e       # e2e (spins up a real Postgres via testcontainers — needs Docker)
npm run lint
npm run build

# client/
npm run build           # includes a full TypeScript check
npm run lint
```

The server e2e suite (`server/test/`) is the most meaningful proof of
correctness end-to-end: pagination/search math, every auth 401/403 case,
full apartment CRUD including the 409 duplicate-unit conflict, the
`login 429` case, and image add/remove — all against a real Postgres
instance, not mocks.

## What's next

Roughly in priority order if this continued past the take-home:

- **Structured logging** (`nestjs-pino`, request-id correlation, secret
  redaction) — cut for time in Phase 5, the highest-value remaining
  hardening item.
- **Client test suite** (Vitest + Testing Library) for the pure functions
  (`search-params.ts` parsing, `format.ts`) and the interactive client
  components — none exist yet.
- **CI** (GitHub Actions: server lint/unit/e2e → client lint/build →
  `docker compose build`) — everything it would run already works locally,
  it just isn't automated yet.
- **Keyset/cursor pagination** — offset pagination is fine at this scale
  and is what's shipped; documented as the scale answer, not built.
- **`openapi-typescript`-generated client types** — right now the client's
  API types are hand-written and kept in sync manually with the server
  DTOs; codegen from the live Swagger JSON would remove that manual step.
- **An optional file-upload path alongside URL-based images**, if a real
  admin workflow ever needs "upload from my computer" rather than "paste a
  link."
