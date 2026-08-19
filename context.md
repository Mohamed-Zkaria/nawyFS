# Session Context — Nawy Apartments

> Handoff notes for resuming this build in a new session. `ImplementationPlan.md`'s "Status" section
> (top of that file) has the scannable done/remaining list — this file captures the *reasoning* behind
> decisions and the gotchas hit, so nothing has to be re-derived from scratch.

## How to resume

Tell the next session: *"Read ImplementationPlan.md's Status section and context.md, then continue."*
Everything is committed to git on `main` (nothing pushed to `origin`). No background processes are
running — any dev server / Docker container from a previous session was stopped before ending it.

Immediate next step (see ImplementationPlan.md Status item 1): write `test/auth.e2e-spec.ts` and extend
`test/apartments.e2e-spec.ts` with `POST /apartments` cases, then actually run `npm run test:e2e`
(testcontainers — needs Docker running). This was written but never executed before the session ended.

## User working style — apply these without being asked again

- **Stop after every phase for review.** Do not chain phases in one uninterrupted run. Report what was
  built + verified, then wait. (Explicit standing instruction, given mid-Phase-0.)
- **Commit only when asked**, with a proper descriptive message explaining *why*, not just what. No
  `Co-Authored-By` footer (global CLAUDE.md preference).
- User will jump ahead of the planned phase order when they want something (e.g. the admin-account
  request came before Phase 3). When that happens, scope it as tightly as the literal request implies
  rather than pulling in the rest of that phase — say explicitly what's deferred and why.
- User is fine with browser-verification via the Claude-in-Chrome tool, and with a temporary manual
  Docker Postgres container for pre-Phase-3 local verification (real `docker-compose` doesn't exist yet).
  Always stop/remove temp containers and background dev servers before ending a turn/session.

## Decisions made that deviate from ImplementationPlan.md's literal text

1. **Env schema is built incrementally, per-phase** — not fully upfront as §10's example implies. Each
   phase adds only the env vars it consumes (Phase 0: app/logging/swagger; Phase 1: DB + uploads public
   path; the auth work: JWT/bcrypt/admin vars). Confirmed explicitly with the user via AskUserQuestion
   before Phase 0 — this was a deliberate choice, not an oversight, precisely because it keeps each
   phase's diff self-contained.
2. **`client/.env.example` deferred to Phase 2**, not created empty in Phase 0, for the same reason —
   nothing in Phase 0/1 consumes client env vars.
3. **No same-origin proxy route, no `/uploads` route handler, no runtime-config provider yet.** Nothing
   built so far makes a *client-side* call to the API — search is a server re-render triggered by a URL
   change, not a fetch. These have no caller until Phase 4's admin forms / real image uploads exist.
   `APP_NAME` in the header is a hardcoded string, not env-driven, for the same reason (it's UI copy, not
   an environment-varying value, so it doesn't violate the zero-`NEXT_PUBLIC_*` rule).
4. **Auth + admin "create" was built ahead of the planned sequence**, at the user's explicit request
   ("let's add a single admin account that has the availability to create everything"), before Phase 3
   (Docker). Scoped deliberately narrow to match "create": users table, JWT login/register/me, global
   guards, seeded admin, `POST /apartments` only. No `PATCH`/`DELETE`, no image upload/storage module, no
   rate limiting (`@nestjs/throttler`), no client-side login UI — those remain in the full Phase 4.
5. **`apartment_images` stays empty** through everything built so far — every apartment/card/gallery
   falls back to `public/apartment-placeholder.svg`. Real uploads are still Phase 4 (storage module).

## Non-obvious bugs hit and fixed (won't be re-discovered from reading the code alone)

- **Scaffold's `.eslintrc.js` incompatible with `eslint@^9`** (needs flat config). Fixed by replacing with
  `server/eslint.config.js`. Pre-existing scaffold issue, not something introduced.
- **`z.coerce.boolean()` uses JS `Boolean(str)` semantics** — `"false"` coerces to `true` (any non-empty
  string is truthy). All boolean env vars use a custom `booleanEnvVar()` helper in `env.validation.ts`
  (`z.enum(['true','false']).transform(...)`) instead.
- **`enableVersioning()` versions *every* route by default, including ones excluded from the global
  prefix.** `/health` 404'd until `HealthController` was marked `@Controller({ path: 'health', version:
  VERSION_NEUTRAL })`.
- **TS `baseUrl` triggers a deprecation warning** (removed in future TS). Use `paths: { "@/*": ["./src/*"] }`
  with no `baseUrl` instead (relative paths, resolved from the tsconfig location).
- **`strict: true` without `esModuleInterop: true`** makes `import * as request from 'supertest'` a real
  type error (ts-jest silently tolerates it at runtime; a real `tsc` pass wouldn't). Added
  `esModuleInterop: true` to `server/tsconfig.json` and switched to default imports (`import request from
  'supertest'`) in all e2e spec files.
- **Jest's `globalSetup`/`globalTeardown` run outside Jest's module sandbox** — no `@/` alias resolution,
  plain Node `require`. `test/setup/testcontainers-global-setup.ts` avoids importing anything that
  transitively pulls in `@/`-aliased files (i.e. don't import entity classes there — migration classes
  only import from `typeorm`, so `entities: []` is fine for `runMigrations()`).
- **e2e spec files sharing one testcontainers Postgres instance raced each other** — Jest runs separate
  test *files* in parallel workers by default, so one file's fixture rows leaked into another's assertion.
  Fixed with `--runInBand` on the `test:e2e` npm script (standard fix for e2e suites sharing one DB).
- **ESLint's `react-hooks/refs` rule** (client) forbids writing to `ref.current` during render. Fixed in
  `use-debounced-callback.ts` by moving the ref update into a `useEffect`.
- **`client/.gitignore`'s blanket `.env*` silently swallowed `.env.example`** (unlike `server/`'s more
  specific gitignore). Added `!.env.example` exception — otherwise the committed example file would have
  silently never been tracked.
- **`resize_window` (browser automation tool) didn't actually change the captured viewport** in this
  environment — screenshots came back at the original window size regardless of the requested dimensions.
  Mobile-breakpoint rendering is therefore *unverified by screenshot*, though the grid uses the plan's
  exact standard Tailwind classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).

## Conventions established (follow these for anything new)

- **Repository port pattern**: abstract class as DI token (not `Symbol`+`@Inject`), one TypeORM adapter,
  one in-memory test double per aggregate (`InMemoryApartmentRepository`, `InMemoryProjectRepository`,
  `InMemoryUserRepository`) living alongside the real adapter under `repositories/`.
- **`AppConfigService`** is the *only* class that injects `ConfigService`. Every new env var: (1) add to
  the Zod schema in `env.validation.ts`, (2) add a `to<X>Config()` pure function + interface in
  `configuration.ts`, (3) add a getter + snapshot key in `app-config.service.ts`, (4) add to
  `server/.env.example`. Only add vars when something actually consumes them (see deviation #1 above).
- **Error envelope**: `{ statusCode, error: { code, message, details?, requestId?, timestamp, path } }`,
  built by `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`). Domain not-found
  exceptions live in `src/common/exceptions/domain.exceptions.ts`. New error codes go in
  `src/common/constants/error-codes.ts`.
- **Success envelope**: `{ data }` or `{ data, meta }`, applied globally by
  `ResponseEnvelopeInterceptor` — handlers just return the raw payload or an already-`{data,meta}`-shaped
  object (pagination), never wrap manually.
- **Deterministic test factories, never faker** — see `modules/*/test/*.factory.ts` (incrementing counter
  pattern). Same rule for e2e fixtures.
- **Migrations are hand-written raw SQL** (not `migration:generate` against a live DB), numbered
  `173500000000{N}-Name.ts`. Current set: `InitialSchema`, `SearchIndexes` (pg_trgm), `Users`.

## Local verification commands (no Docker Compose yet — that's Phase 3)

```bash
# Postgres (temp container — stop/rm when done)
docker run -d --name nawy-dev-postgres -e POSTGRES_USER=nawy -e POSTGRES_PASSWORD=nawy_dev_only \
  -e POSTGRES_DB=nawy -p 5432:5432 postgres:17-alpine

# server/
npm run db:migrate && npm run db:seed   # ts-node, reads DB_* from process.env (defaults match above)
npm run build && npm run lint && npm test && npm run test:e2e   # test:e2e spins its own testcontainers PG
node dist/main.js   # or npm run start:dev — API on :4000, Swagger at /api/docs

# client/
npm run build && npm run lint
API_INTERNAL_URL=http://localhost:4000/api/v1 npm run dev   # :3000
```

Seeded admin login (once seeded): `POST /api/v1/auth/login` with the `ADMIN_EMAIL`/`ADMIN_PASSWORD`
defaults from `server/.env.example` (`admin@nawy.local` / `ChangeMe_Admin123!`) unless overridden.
