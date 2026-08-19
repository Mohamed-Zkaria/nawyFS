# Nawy Apartments — Implementation Plan

> Working plan for the senior fullstack take-home in `NawySeniorTask.md`.
> Grading order is stated in the brief: **Functionality > code quality > project structure > documentation.**
> Every sequencing decision below follows from that order.

---

## Status (updated by Claude at end of last session — resume point)

**Done and committed** (git log, oldest first): `9409733` design docs · `3f8cae6` Phase 0 · `4ef4038` Phase 1 ·
`0391306` Phase 2 · `da486d4` auth + admin create (see below). Nothing pushed to `origin` yet.

- **Phase 0 — Foundation**: done as designed. One addition beyond plan text: `eslint.config.js` (flat config)
  replaces the scaffold's incompatible `.eslintrc.js`; `esModuleInterop: true` added to `tsconfig.json`
  (needed once `test/` files use default imports like `import request from 'supertest'`).
- **Phase 1 — Data + read APIs**: done. `GET /apartments` (pagination/search/filter/sort), `GET /apartments/:id`,
  `GET /projects`, envelope interceptor, exception filter, Swagger at `/api/docs`. **Deviation**: env schema and
  `.env.example` are built *incrementally* per-phase (only vars a phase actually consumes), not fully upfront as
  §10's example implies — a deliberate call confirmed with the user, not an oversight. 16 unit + 11 e2e tests,
  all passing against a real Postgres via testcontainers.
- **Phase 2 — Frontend listing + detail**: done. Listing page (debounced URL search, project filter, sort,
  pagination), detail page + gallery, loading/error/not-found, responsive grid. **Deviation**: no same-origin
  proxy route, no `/uploads` route handler, no runtime-config provider yet — nothing in this phase makes a
  client-side call to the API (search is a server re-render via URL change), so these have no caller. Deferred
  to whenever Phase 4's admin forms / real uploads need them.
- **Auth + admin "create" (done ahead of sequence, at the user's explicit request)**: `users` table + migration,
  JWT auth module (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`), global `JwtAuthGuard` +
  `RolesGuard` with `@Public()`/`@Roles()`, `bcryptjs` behind a `PasswordHasher` port, idempotent seeded admin
  from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. **Admin-only `POST /api/v1/apartments`**: exactly one of `projectId` or
  `projectName`+`projectCity` (auto-creates the project if named and not found); PG `23505` on
  `uq_apartments_project_unit` now maps to `409 UNIT_ALREADY_EXISTS` in the exception filter.
  **Scoped narrowly on purpose**: this is a subset of Phase 4 below — no `PATCH`/`DELETE`, no image upload/
  storage module, no rate limiting, no client-side login UI. 32 unit tests passing (incl. `auth.service.spec.ts`,
  `roles.guard.spec.ts`), build clean, lint clean.

**Done since (this session):**
1. **e2e tests for the new auth/create endpoints** — added `test/auth.e2e-spec.ts` (register 201/409/400,
   login 200/401-same-body, `/auth/me` 200/401) and `POST /apartments` cases in `test/apartments.e2e-spec.ts`
   (401 unauthenticated → 403 normal-user → 201 admin → 409 duplicate unit → 201 auto-created project by
   name → 400 neither projectId/projectName). Ran `npm run test:e2e` for real against testcontainers —
   **28/28 passing.** `npm test` (unit) 32/32, `npm run build` and `npm run lint` clean.
2. **Two real bugs found and fixed while getting the e2e run green** (not test-content issues — see
   context.md for the full root-cause writeup):
   - `test/setup/test-app.ts` statically imported `AppModule`, which transitively evaluates
     `ConfigModule.forRoot()` at *import* time (before `applyTestDbEnv()` ever ran), so every e2e run was
     silently validating against the default `DB_PORT=5432` instead of the testcontainers port. Fixed by
     switching to a dynamic `await import(...)` inside `createTestApp()`, after `applyTestDbEnv()`.
   - Adding the global `JwtAuthGuard` (secure-by-default) during the auth work never got `@Public()` added
     to the pre-existing public read routes it now covers — `GET /health`, `GET /projects`,
     `GET /apartments`, `GET /apartments/:id` were all silently 401ing. Fixed by adding `@Public()` to all
     four handlers.
3. **Live manual verification** of the new endpoints (temp Postgres + seed + curl/Swagger) — still not done;
   the e2e suite exercises the same paths but a from-scratch manual pass hasn't happened.

**Not yet done — pick up here:**
1. **Live manual verification** (see above) — optional at this point given e2e coverage, but still on the
   original list.
2. **Phase 3 — Docker one-command** (next MUST-priority phase per §13 below) — not started. No `Dockerfile`
   in either project, no `docker-compose.yml`.
3. **Rest of Phase 4** — `PATCH`/`DELETE` apartments, image upload + `StorageService` + static serving +
   the `/uploads` route handler, client login page + session cookie handler + `/admin/*` pages. Not started.
4. **Phases 5–7** (hardening, coverage/docs, polish) — not started.

Stop-after-each-phase is a standing instruction from the user — do not chain multiple phases in one
uninterrupted run; report and wait after finishing each one.

---

## 1. Context

Build an apartment listing app: a TypeScript API (list, detail, create), a responsive Next.js frontend
(listing page, detail page), a database, and the whole stack runnable with a single `docker-compose up`.
Bonus: search by unit name, unit number, or project.

**Starting point — both projects are untouched scaffolds:**

| | State |
|---|---|
| `server/` | `nest new` output. `src/main.ts` is 8 lines. No DB, no config layer, no validation. `tsconfig.json` has `strictNullChecks: false`, `noImplicitAny: false`. Jest + supertest e2e harness already wired. |
| `client/` | `create-next-app` output. Next 16.3.1, React 19.2.8, Tailwind v4 (CSS-configured, no `tailwind.config`), alias `@/* → ./src/*`. No tests. |
| `InitialSystemDesign/` | ERD + 7 mermaid sequence diagrams already authored — covering auth, admin CRUD, and paginated listing. |
| root | `README.md` is a one-line stub. No `package.json`, no Docker, no CI. |

**Toolchain verified locally:** Node 24.13.1 · Docker 29.3.1 · Compose v5.1.1.

**Scope decision:** implement the *full* designed scope from `InitialSystemDesign/`, not just the three
required endpoints — register/login with JWT, role-based admin guard, full CRUD, plus listing/detail/search.
The design docs become proof of intent rather than unimplemented decoration.

---

## 2. Verified facts that drive the design

These were checked against the installed sources, not assumed. Several overturn the "obvious" approach.

| Finding | Verified in | Consequence |
|---|---|---|
| `params` / `searchParams` are **Promises**; `PageProps<"/route">` are global types | `next/dist/docs/.../page.md`; already used in `client/src/app/layout.tsx` | Every page is `async` and must `await searchParams` |
| `fetch` is **not cached by default** in Next 16 | `01-getting-started/06-fetching-data.md` | No `cache: 'no-store'` boilerplate needed |
| `rewrites()` are serialized into `.next/routes-manifest.json` **at build time** | `next/dist/build/index.js` | ❗ Rewrites **cannot** be the runtime-config mechanism |
| **`images.dangerouslyAllowLocalIP` defaults to `false`** (new in v16) — the optimizer resolves the upstream host and rejects private/loopback IPs with 400 | `next/dist/shared/lib/image-config.js:64` ✅ *re-verified* | ❗ `<Image src="http://api:4000/uploads/…">` **will 400 in compose** |
| Local (`/…`) image srcs route through `fetchInternalImage` → `routerServerHandler` | `next/dist/server/next-server.js:759-787` | ✅ A Route Handler at `/uploads/[...]` is a valid, optimizable image source |
| `priority` is **deprecated** → use `preload`; `images.qualities` defaults to `[75]` | `02-components/image.md` | Passing `quality={80}` unconfigured returns 400 |
| `middleware.ts` is **deprecated → `proxy.ts`** | `03-file-conventions/proxy.md` exists alongside `middleware.md` ✅ *re-verified* | Don't create `middleware.ts` |
| Turbopack is the default bundler for `next build` | `06-cli/next.md` | Verify `.next/standalone/server.js` is emitted before relying on it |
| `@nestjs/swagger@11` peers require **Nest 11**; `@nestjs/swagger@8` caps at Nest 10 | `npm view` | See decision D1 |
| `typeorm` tags: `latest: 1.1.0`, **`legacy: 0.3.31`** | `npm view` | See decision D2 |

---

## 3. Phase 0 decisions (cheap now, expensive later)

- **D1 — Upgrade the server to NestJS 11.** `@nestjs/common|core|platform-express|testing|cli|schematics` → `^11`.
  Staying on 10 pins you to `@nestjs/swagger@8` and older `@nestjs/config`. Nest 11 needs Node ≥ 20; we have 24.
  This is a mechanical bump across 4 scaffold files.
- **D2 — Pin `typeorm@^0.3.31`** (the `legacy` tag), not `1.1.0`. `1.1.0` is brand new and its `DataSource` /
  migration semantics are unverified here. A take-home is the wrong place to debug an ORM major. Document the choice.
- **D3 — `tsconfig.json` → `"strict": true`.** Remove all four loosening flags. Add `baseUrl` + `paths: {"@/*": ["src/*"]}`
  and mirror in Jest `moduleNameMapper` and `test/jest-e2e.json`, so both projects share the `@/` convention.
- **D4 — Ports: API `4000`, web `3000`, Postgres `5432`.** Both scaffolds default to 3000. Change the API default in
  its own config schema, not just in compose — otherwise `npm run start:dev` collides with `next dev` locally.
- **D5 — `bcryptjs`, not `bcrypt`.** Native `bcrypt` needs `python3 make g++` in the alpine build stage. `bcryptjs`
  is pure JS and sits behind a `PasswordHasher` port anyway, so it's a one-line swap. Removes a whole class of Docker failures.
- **D6 — Delete the scaffold** `app.controller.ts` / `app.service.ts` / `app.controller.spec.ts`. A leftover
  `getHello()` in a "senior" submission is a visible smell.
- **D7 — Extract `bootstrap.ts`.** `configureApp(app)` holds pipes, filters, prefix, versioning, helmet, CORS,
  static assets, shutdown hooks — and is shared by `main.ts` **and** the e2e suite. If e2e applies its own config,
  the tests validate a setup that doesn't ship.

---

## 4. Server architecture

```
server/src/
  main.ts                        # thin: create app → configureApp() → listen
  bootstrap.ts                   # ← shared with e2e (D7)
  app.module.ts                  # composition root only
  config/      env.validation.ts (Zod) · configuration.ts · app-config.service.ts · config.module.ts
  database/    database.module.ts · data-source.ts · cli.ts · migrations/ · seeds/
  common/      decorators/ · dto/ · filters/ · interceptors/ · interfaces/ · constants/error-codes.ts
  health/      health.module.ts · health.controller.ts
  modules/
    apartments/  controller · service · entities/ · repositories/{port,typeorm} · mappers/ · dto/
    projects/    (same shape)
    users/       (same shape)
    auth/        controller · service · strategies/jwt · guards/{jwt-auth,roles} · hashing/{port,bcrypt} · dto/
    storage/     storage.port.ts · local-disk-storage.service.ts · multer-options.factory.ts
```

### The one structural idea that carries the design

**Abstract classes as DI tokens** — not `Symbol` + `@Inject('TOKEN')`:

```ts
export abstract class ApartmentRepositoryPort {
  abstract findPaginated(filter: ApartmentFilter): Promise<[Apartment[], number]>;
  abstract findById(id: string): Promise<Apartment | null>;
  abstract save(apartment: Apartment): Promise<Apartment>;
  abstract softRemove(apartment: Apartment): Promise<void>;
}
// apartments.module.ts
providers: [{ provide: ApartmentRepositoryPort, useClass: TypeOrmApartmentRepository }]
```

The service takes `private readonly repo: ApartmentRepositoryPort` — compile-time typed, no magic strings,
and a unit test swaps in `InMemoryApartmentRepository`. This single convention is what makes the SOLID story
**demonstrable** rather than asserted.

### SOLID, concretely (belongs in the README as a table)

- **SRP** — controller = HTTP/serialization · service = use case · repository = persistence · mapper = wire shape. Four reasons to change, four files.
- **OCP** — adding S3 means adding `S3StorageService` and changing one `useClass` line. `ApartmentsService` is untouched.
- **LSP** — `InMemoryApartmentRepository` and `TypeOrmApartmentRepository` are interchangeable behind the port. *The unit suite is the LSP proof.*
- **ISP** — the port exposes 4 methods, not TypeORM's ~60-method `Repository<T>`. The service can't reach for `.query()`.
- **DIP** — high-level policy depends on an abstraction owned by its own module; the TypeORM detail depends on that same abstraction.

### Patterns used

| Pattern | Where | Why it earns its keep |
|---|---|---|
| Repository / Ports & Adapters | `*.repository.port.ts` + `typeorm-*.repository.ts` | Enables DB-free unit tests |
| Adapter | `LocalDiskStorageService`, `BcryptPasswordHasher` | Isolates two swappable infra choices |
| Strategy | `JwtStrategy` | Literally passport's design |
| Mapper / DTO | `ApartmentMapper.toDetail()` | Stops entity leakage; **composes image URLs from config** |
| Decorator | `@Public()`, `@Roles()`, `@CurrentUser()`, guards, interceptors | Cross-cutting concerns, zero custom framework code |
| Factory | `MulterModule.registerAsync`, `TypeOrmModule.forRootAsync` | The only way to build config-dependent providers |

### Patterns deliberately **rejected** — and why

> Restraint is invisible unless you name it. This list goes in the README verbatim; without it a reviewer
> cannot distinguish restraint from ignorance.

- **CQRS / `@nestjs/cqrs`** — command+handler+query+handler buses for ~12 endpoints is pure ceremony. Net negative.
- **Full hexagonal with duplicated models** — a pure `domain/Apartment` *plus* `ApartmentOrmEntity` *plus*
  bidirectional mappers doubles the file count for a 3-table schema.
  **Decision: TypeORM entities *are* the domain model; the boundary is enforced one-way at the DTO edge.**
- **Event sourcing / domain events / outbox / sagas** — no.
- **Generic `BaseCrudService<T>`** — looks DRY, breaks LSP/OCP the first time one entity differs. Prefer a shared `paginate(qb, query)` helper.
- **Specification pattern for filters** — one `applyFilters()` with 5 `andWhere`s is clearer. Revisit at ~15 filters.
- **Hand-rolled logging interceptor** — `nestjs-pino` already does it.

*Judgement call:* keep `UserRepositoryPort` even though `UsersService` only needs `findByEmail`/`save` —
architectural symmetry is worth one 8-line file, and it makes `AuthService` testable with zero DB.

---

## 5. Data model

Three deliberate upgrades over the draft ERD. **Each must be reflected back into `InitialSystemDesign/` in Phase 6.**

**`projects` is normalized** into its own table (`id`, `name`, `slug` unique, `city`, timestamps) with
`CREATE UNIQUE INDEX uq_projects_name_lower ON projects (lower(name))`.
*Why:* a project is a genuine entity — one project, many units — and the bonus feature filters by it. A plain
`varchar` means `SELECT DISTINCT project` to build a dropdown, no referential integrity, and inevitable
`"Sunset"` / `"sunset "` drift. Cost is one join.

**`unit_number` is `varchar(40)`, not numeric.** Real unit numbers are `A-12`, `12B`, `03/04`. Numeric storage
loses leading zeros and breaks the search requirement.

**Images become a one-to-many `apartment_images` table**, not a single `image` column — the detail page wants
a gallery, and `coverImage` is derived as the lowest `sort_order`.

```
projects          id uuid pk · name varchar(120) · slug varchar(140) unique · city · created_at · updated_at

apartments        id uuid pk · unit_name varchar(120) · unit_number varchar(40)
                  · project_id uuid fk → projects ON DELETE RESTRICT
                  · description text · price numeric(12,2) CHECK (>= 0)
                  · bedrooms smallint CHECK (0..20) · bathrooms smallint · area_sqm numeric(8,2) CHECK (> 0)
                  · created_at · updated_at · deleted_at   (@DeleteDateColumn — soft delete)

apartment_images  id uuid pk · apartment_id uuid fk → apartments ON DELETE CASCADE
                  · storage_key varchar(255) · original_name · mime_type · size_bytes
                  · sort_order smallint · created_at

users             id uuid pk · email varchar(320) unique (lowercased on write)
                  · password_hash varchar(255) @Column({ select: false })
                  · role enum('admin','normal') default 'normal' · created_at · updated_at
```

**Key constraints & rules**

- `CREATE UNIQUE INDEX uq_apartments_project_unit ON apartments (project_id, unit_number) WHERE deleted_at IS NULL;`
  — a *partial* unique index. Map PG error `23505` → **409 `UNIT_ALREADY_EXISTS`** in the exception filter.
- **Soft delete**: `DELETE` still returns 204, but the row survives so uploaded images aren't orphaned.
  Deviates from `adminSeuqenceDeleteApartment.md`'s literal `DELETE FROM` — update the diagram.
- **Store the storage *key*, never an absolute URL.** Persisting `http://localhost:4000/uploads/x.jpg` would bake
  the environment into the database — the single most common violation of the "nothing hardcoded" rule.
- `select: false` on `password_hash` means it can never be accidentally serialized; login explicitly
  `addSelect('user.passwordHash')`.
- Lowercase-on-write + plain UNIQUE beats the `citext` extension (no extension dependency, identical behaviour).
- Fields beyond the ERD (`price`, `bedrooms`, `area_sqm`) exist because good UI is graded and a card showing
  only a name and a number looks unfinished.

### Search indexing (the bonus feature)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_apartments_unit_name_trgm   ON apartments USING gin (unit_name   gin_trgm_ops);
CREATE INDEX idx_apartments_unit_number_trgm ON apartments USING gin (unit_number gin_trgm_ops);
CREATE INDEX idx_projects_name_trgm          ON projects   USING gin (name        gin_trgm_ops);
```

Query: `unit_name ILIKE :q OR unit_number ILIKE :q OR project.name ILIKE :q`.

**Why trigram, not full-text search:** `tsvector`/`to_tsquery` is lexeme- and prefix-based — it cannot match
*infixes*, so searching `"A-1"` or `"nit 12"` returns nothing. A search box over short identifier-like fields
needs `ILIKE '%x%'`, and trigram GIN is the only index that accelerates a leading-wildcard `ILIKE`. FTS would be
right for `description`; it is wrong here.

**Two correctness details that reviewers look for:**
1. **Escape LIKE metacharacters**: `q.replace(/[\\%_]/g, c => '\\' + c)`. Without this, typing `%` matches everything.
2. Trim, require length ≥ 1, cap at 100 chars in the DTO.

*Honesty note for the README:* at seed scale (~200 rows) Postgres seq-scans regardless. The index is for
correctness of intent, not measured speed — claiming an unmeasured performance win is worse than explaining the reasoning.

Supporting B-trees: `apartments(project_id)`, `apartments(created_at DESC)`.
Default sort is `created_at DESC, id DESC` — the `id` tie-break stops rows shifting between pages.

### Migrations & seed

- **`synchronize: false` always, including development.** Migrations are the only schema path. Non-negotiable
  for a "production-grade" claim.
- `data-source.ts` exports `AppDataSource` for the TypeORM CLI (dev only).
- **The production image does not ship the TypeORM CLI.** `database/cli.ts` compiles to `dist/database/cli.js`
  and accepts `migrate` / `seed`, used by the compose `migrator` service.
- **Seed is idempotent** — upsert by natural key (`projects.slug`, `(project_id, unit_number)`, `users.email`).
  ~8 projects, ~60 apartments, image rows pointing at `server/assets/seed-images/` copied into `UPLOAD_DIR`,
  and the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Refuses to seed the default admin password when `NODE_ENV=production`.

---

## 6. API contract

**Versioning: yes.** `setGlobalPrefix('api', { exclude: ['health', 'uploads/(.*)'] })` +
`enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` → `/api/v1/...`. Two lines, zero ongoing cost.

**Success envelope** `{ "data": <T>, "meta": { … } }` · **Error envelope:**

```jsonc
{ "statusCode": 404,
  "error": { "code": "APARTMENT_NOT_FOUND", "message": "Apartment not found",
             "details": [{ "field": "unitName", "constraint": "isNotEmpty" }],
             "requestId": "b1f0…", "timestamp": "…", "path": "/api/v1/apartments/abc" } }
```

The **machine-readable `code`** is the part that matters — the frontend switches on `code`, never on the human
message. `requestId` ties a client-visible error to a server log line.

`meta` = `{ page, limit, total, totalPages, hasNextPage, hasPreviousPage }`. Offset pagination (KISS);
note keyset/cursor as the scale answer under "what I'd do next".

| Method | Path | Auth | Success | Errors |
|---|---|---|---|---|
| `GET` | `/api/v1/apartments` | public | 200 `{data[], meta}` | 400 |
| `GET` | `/api/v1/apartments/:id` | public | 200 `{data}` | 400, 404 `APARTMENT_NOT_FOUND` |
| `POST` | `/api/v1/apartments` | **admin** | 201 `{data}` | 400, 401, 403, 409 `UNIT_ALREADY_EXISTS` |
| `PATCH` | `/api/v1/apartments/:id` | **admin** | 200 `{data}` | 400, 401, 403, 404, 409 |
| `DELETE` | `/api/v1/apartments/:id` | **admin** | 204 | 401, 403, 404 |
| `POST` | `/api/v1/apartments/:id/images` | **admin** | 201 `{data[]}` | 400, 401, 403, 404, 413 `FILE_TOO_LARGE`, 415 `UNSUPPORTED_FILE_TYPE` |
| `DELETE` | `/api/v1/apartments/:id/images/:imageId` | **admin** | 204 | 401, 403, 404 |
| `GET` | `/api/v1/projects` | public | 200 `{data[]}` | 400 |
| `POST` | `/api/v1/auth/register` | public | 201 `{data:{accessToken,expiresIn,user}}` | 400, 409 `EMAIL_ALREADY_EXISTS`, 429 |
| `POST` | `/api/v1/auth/login` | public | 200 same | 400, 401 `INVALID_CREDENTIALS`, 429 |
| `GET` | `/api/v1/auth/me` | bearer | 200 `{data}` | 401 |
| `GET` | `/health` · `/api/docs` · `/uploads/<key>` | public | 200 | — |

**Deviations from `InitialSystemDesign/` to record and fix in the diagrams:**
`/api/users/*` → `/api/v1/auth/*` (auth is a distinct concern) · `PUT` → **`PATCH`** (the sequence sends
"updated fields" = partial semantics; `PUT` implies full replacement) · create is split into JSON create +
a separate multipart image endpoint · `adminSequenceReadApartment.md` merges into the public read.

**Why split create from upload:** in a single multipart endpoint every scalar arrives as a string, forcing
`enableImplicitConversion` plus per-field `@Transform`, and nested validation gets ugly. Two endpoints keep
`CreateApartmentDto` a clean JSON contract and make images a proper subresource.
*Cost:* admin "create with photo" is two requests — hidden behind one `createApartmentWithImages()` client function.

### Validation

```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
                     transformOptions: { enableImplicitConversion: true } })
```

`forbidNonWhitelisted` is a security control: it is what 400s a client smuggling `role: "admin"` into register.

- `QueryApartmentsDto` — `page` ≥1 (default 1) · `limit` 1..50 (default 12) · `search` 1..100 + trim ·
  `projectId` `@IsUUID` · `minPrice`/`maxPrice` + class-level `MinLessThanMax` · `bedrooms` 0..20 ·
  **`sortBy` `@IsEnum(['createdAt','price','unitName'])`** — *never* a raw string interpolated into `orderBy`; that's a SQL-injection vector · `sortOrder` `@IsIn(['ASC','DESC'])`.
- `CreateApartmentDto` — `unitName` 2..120 · `unitNumber` 1..40 `@Matches(/^[A-Za-z0-9\-\/ ]+$/)` ·
  **exactly one of** `projectId` or `projectName` via `@ValidateIf` · `price` `@IsNumber({maxDecimalPlaces:2})`.
- `UpdateApartmentDto extends PartialType(CreateApartmentDto)` (from `@nestjs/swagger`, so OpenAPI updates too).
- `RegisterDto` — `email` `@IsEmail @MaxLength(320)` + lowercase · `password` `@MinLength(8) @MaxLength(72)`.
  **`@MaxLength(72)` matters: bcrypt silently truncates past 72 bytes.**

**Swagger:** `DocumentBuilder().addBearerAuth()`, env-gated via `SWAGGER_ENABLED`/`SWAGGER_PATH`. Enable the CLI
plugin in `nest-cli.json` (`"plugins": ["@nestjs/swagger"]`) so DTO props document themselves. The envelope fights
Swagger's typing — solve it **once** with a reusable `@ApiPaginatedResponse(model)` decorator built on
`ApiExtraModels` + `getSchemaPath`. Hand-writing schemas per endpoint is the DRY failure mode here.

---

## 7. Auth

- **Register** — normalize email → 409 on duplicate → hash → insert with `role='normal'` **hardcoded server-side**
  (never read from the body, regardless of the whitelist) → return a token so the client isn't forced into a second round-trip.
- **Login** — `addSelect('user.passwordHash')` → compare → sign. **Identical `INVALID_CREDENTIALS` 401 for both
  unknown-email and wrong-password** (no user enumeration), plus a dummy hash comparison when the user doesn't
  exist so response timing doesn't leak existence. One line, real signal.
- **`PasswordHasher` port** + `BcryptPasswordHasher`. `BCRYPT_SALT_ROUNDS=12`, **`=4` in the test env** — otherwise
  every e2e test that registers a user costs ~300 ms. A concrete, defensible use of env config.
- **JWT** — payload `{ sub, email, role }`, `JWT_EXPIRES_IN=1h`, `JWT_ISSUER`, `JWT_SECRET` required with `.min(32)`.
  `validate()` returns claims — **no DB lookup per request**. *Tradeoff to state:* a role change doesn't take effect
  until expiry; acceptable at 1h, and the fix (version claim / short cache) is a "next step".
- **`JwtAuthGuard` registered globally** via `APP_GUARD` + a `@Public()` decorator checked over handler *and* class.
  **Secure-by-default**: forgetting a decorator makes an endpoint inaccessible, never accidentally public.
- **`RolesGuard` also global**, listed *after* `JwtAuthGuard` (global guards run in registration order).
- **`@CurrentUser()`** param decorator so controllers never touch `req.user`.
- **Rate limiting** — `@nestjs/throttler` global (120/min) + a tighter named throttler on `/auth/*` (10/min).
  Remember to raise both in the test env or e2e will 429.

**Deliberate non-goals** (README section — naming what you chose not to build is the cheapest senior signal):
no refresh-token rotation (access+refresh+rotation+reuse-detection+revocation store is 400+ lines and a new table
for zero grading benefit at a 1h TTL), no password reset / email verification / SMTP, no OAuth, no 2FA,
no permission-matrix RBAC, no account lockout (rate limiting covers it).

**Browser token storage — httpOnly cookie, not `localStorage`.** A Next Route Handler (`POST /api/session`) sets
`nawy_session` (`httpOnly`, `sameSite=lax`, `secure` from env); `DELETE` clears it. XSS-resistant, *and* it lets
`app/admin/layout.tsx` read the token server-side via `cookies()` so admin pages render on the server —
`localStorage` would force every admin page to be a client component.

---

## 8. File upload

```ts
export abstract class StorageService {
  abstract save(file: Express.Multer.File): Promise<StoredObject>;
  abstract remove(key: string): Promise<void>;
  abstract getPublicUrl(key: string): string;
}
```

- `MulterModule.registerAsync({ inject: [AppConfigService], useFactory })` — config-driven Factory.
- `destination`: `${UPLOAD_DIR}/${YYYY}/${MM}`, `mkdirSync(recursive)` — avoids one directory with 100k entries.
- `filename`: `${randomUUID()}${extname(originalname).toLowerCase()}`.
  **Never reuse `originalname` on disk** — that's the path-traversal and overwrite vector. Keep it in the DB for display only.
- `limits: { fileSize: UPLOAD_MAX_FILE_SIZE_BYTES (5 MiB), files: UPLOAD_MAX_FILES (5) }`; `fileFilter` allowlist from env.
- ❗ **An unhandled `MulterError` surfaces as a 500.** Add a `MulterError` branch to `AllExceptionsFilter`:
  `LIMIT_FILE_SIZE` → **413**, `LIMIT_FILE_COUNT` / `LIMIT_UNEXPECTED_FILE` → 400.
- **Defense in depth:** the client-supplied `mimetype` is spoofable. Add a `FileValidator` that checks magic bytes
  (JPEG/PNG/WebP signatures, ~12 lines) and deletes the temp file on failure. *Should-have* — it's what separates
  "validated uploads" from actually-validated uploads.
- **Static serving** in `bootstrap.ts`:
  `app.useStaticAssets(cfg.uploads.dir, { prefix: '/uploads/', maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' })`.
  ❗ **helmet defaults `Cross-Origin-Resource-Policy: same-origin`, which blocks cross-origin `<img>` loads.**
  Set `crossOriginResourcePolicy: { policy: 'cross-origin' }`. The symptom is a silently broken image and a
  console CORP error — easy to lose an hour to.
- **URL configurability (the key rule):** `getPublicUrl(key)` returns `` `${PUBLIC_UPLOADS_PATH}/${key}` `` — a
  **relative, host-agnostic path**, composed in the mapper. Nothing absolute is ever persisted, so the same DB dump
  works in dev, docker, and any future deploy.
- **Delete ordering:** in a transaction, delete the DB row first, then the file best-effort with failures logged.
  A failed file delete leaves a harmless orphan; the reverse leaves a row pointing at a missing file — a visible
  broken image. Not atomic, and saying so beats pretending.

---

## 9. Frontend architecture

```
client/src/app/
  layout.tsx                 # RSC. Runtime config → <RuntimeConfigProvider>; Header/Footer
  page.tsx                   # redirect('/apartments')
  apartments/
    page.tsx                 # RSC listing. await searchParams. <SearchFilters/> + <Suspense key={qs}><ApartmentGrid/></Suspense>
    loading.tsx  error.tsx
    [id]/page.tsx            # RSC detail + generateMetadata
    [id]/{loading,error,not-found}.tsx
  login/  register/
  admin/layout.tsx           # RSC auth gate: cookies() → /auth/me → redirect
  admin/apartments/{page,new/page,[id]/edit/page}.tsx
  admin/_actions/apartments.ts   # 'use server'
  api/session/route.ts           # httpOnly session cookie
  api/proxy/[...path]/route.ts   # runtime-configurable API proxy  ← §10
  uploads/[...key]/route.ts      # runtime-configurable image origin ← below

client/src/
  components/{layout,apartments,ui,providers}/
  lib/api/{http,server,apartments,projects,auth,types,errors}.ts
  lib/config/{server-config,public-config}.ts
  lib/utils/{format,search-params,cn}.ts
  hooks/{use-debounced-callback,use-runtime-config}.ts
```

**Default to Server Components; add `'use client'` only at the interactive leaf.**
Server: all pages/layouts, `ApartmentGrid`, `ApartmentCard` (pure presentational in a `<Link>` — ships zero JS),
`Pagination` (plain prefetched `<Link>`s), `ResultsSummary`, `EmptyState`.
Client: `SearchFilters`, `ApartmentGallery`, providers, `error.tsx` (must be), all forms.

**Data fetching.** The listing page parses `searchParams` through `parseApartmentsSearchParams()` — a pure,
unit-tested function that coerces and clamps — then calls the server API client. No `cache: 'no-store'` needed.

**Streaming detail worth having:** wrap the grid in ``<Suspense key={`${search}|${page}|${projectId}`}>``.
Changing the key re-triggers the skeleton on every query change, so search feels instant instead of frozen.

**Typed API client.** `apiFetch<T>(path, init?)` picks the base URL (server vs browser), attaches the cookie's
bearer server-side, sets `AbortSignal.timeout(API_TIMEOUT_MS)`, unwraps `{data, meta}`, and throws a typed
`ApiError { status, code, message, details, requestId }`. `lib/api/server.ts` imports the `server-only` package so
the module holding the internal Docker URL can never reach a client bundle.
*Phase 7 upgrade:* `openapi-typescript http://localhost:4000/api/docs-json` — the DRY answer to a shared contract.
**Not** in the Docker build; it would require a running API at build time.

**Search state in the URL.**
`useSearchParams`/`usePathname`/`useRouter` + local state for instant feedback + a 300 ms debounce →
build `URLSearchParams`, drop empties, force `page=1` → `startTransition(() => router.replace(url, { scroll: false }))`.
`isPending` drives a subtle opacity on the results region.
- Write `use-debounced-callback.ts` yourself (~15 lines, `useRef` timer + cleanup) rather than adding a dependency — KISS and directly testable.
- ❗ `useSearchParams()` needs a `<Suspense>` boundary or `next build` errors on prerendering. Wrap `SearchFilters`.
- Pagination stays plain `<Link>` — server-rendered, prefetched, works without JS, correctly *not* debounced.
- Results are shareable, bookmarkable, and the back button works — which a `useState` search silently breaks.

**Images — the important part.**
The problem (verified twice): `dangerouslyAllowLocalIP: false` makes the optimizer reject `http://api:4000/...`
(172.x) *and* `http://localhost:4000/...` (127.0.0.1) with a 400. Separately, `remotePatterns` and `rewrites()`
are both frozen into the build output, so neither can be env-driven.

**Solution — serve uploads through the Next origin as a *local* path**, so `next/image` takes the
`fetchInternalImage` path and never touches the external fetcher:
1. `app/uploads/[...key]/route.ts` streams `${API_UPLOADS_URL}/${key}` **at request time**, forwarding
   `content-type`/`content-length`/`etag` and setting `Cache-Control: public, max-age=31536000, immutable`.
2. Components render `<Image src={`/uploads/${key}`} />` — a local path.
3. Lock it down: `images: { localPatterns: [{ pathname: '/uploads/**', search: '' }] }`.

Full optimization *and* full runtime configurability from a ~25-line file. Document the rejected escape hatches
(`unoptimized: true`, or `dangerouslyAllowLocalIP: true` + `remotePatterns`) so a reviewer sees the alternatives were known.

Other image rules: `fill` + `object-cover` in an `aspect-[4/3]` wrapper with an explicit `sizes` (without it,
`fill` downloads at full viewport width) · **`preload` on the first 2–4 cards — `priority` is deprecated in v16** ·
**don't pass `quality`** unless you also configure `images.qualities` · skip `placeholder="blur"`, a CSS shimmer is
95% of the benefit · `public/apartment-placeholder.svg` fallback.

**Tailwind v4** — no config file; extend `@theme` in `globals.css` with brand/surface/border tokens and
`--radius-card`. Keep the scaffold's `prefers-color-scheme` dark mode (KISS). **Fix the scaffold's
`body { font-family: Arial… }`, which currently overrides the Geist font variables.** Utility-first; extract a class
only when a pattern repeats 5+ times. **Do not build a design system** — the classic take-home time sink.

**Responsive:** container `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` · grid `grid-cols-1 sm:2 lg:3 xl:4` ·
detail stacked → `lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]` with a `lg:sticky` info panel · filter bar
`sticky top-0 z-10` · touch targets ≥ 44px · test at 360/768/1024/1440.

**a11y:** semantic `<main>`/`<nav aria-label="Pagination">`/`<article>` · labelled search input (`sr-only` if hidden) ·
`role="status" aria-live="polite"` on the results count · `aria-current="page"` · `role="alert"` on errors ·
skeletons `aria-hidden` · visible `focus-visible:` rings · ``alt={`${unitName} — ${projectName}`}``. Run axe once and fix what it finds.

**Admin UI** uses React 19 `useActionState` + Server Actions that read the cookie, call the API, then
`revalidatePath()`. **Authorization is enforced server-side in `admin/layout.tsx`** — the Next docs explicitly say
Proxy is for optimistic checks only, and the real authority is the API's `RolesGuard`. The client gate is UX.

---

## 10. Env & configuration

### The client rule: **zero `NEXT_PUBLIC_*` variables**

That single constraint eliminates the entire "the image was built with the wrong API URL" class of bugs and is the
headline answer to the no-hardcoding requirement. Two mechanisms replace it:

**1. Same-origin proxy Route Handlers (primary).** `app/api/proxy/[...path]/route.ts` and `app/uploads/[...key]/route.ts`
share a `proxyRequest(req, targetUrl)` helper reading `process.env.API_INTERNAL_URL` **at request time**.
The browser only ever talks to its own origin, so nothing needs inlining — no CORS, no preflight, no
`remotePatterns`, and image optimization keeps working. Server Components bypass the proxy and call the API directly.
*Tradeoff:* one extra hop for browser-initiated calls. ~40 lines total, a clear net win here. CORS is still
configured on the API (for direct access and Swagger UI), so the allowlist requirement is still demonstrated.

**2. Runtime config provider** for values the browser genuinely needs (`appName`, `uploadsBasePath`,
`maxUploadBytes`, `allowedMimeTypes`): `server-config.ts` (`server-only`, Zod-validated) → `public-config.ts` →
`<RuntimeConfigProvider>` in the RSC `layout.tsx`. Because layout reads env during a *dynamically rendered* request,
one image serves any environment. If a route ever gets statically prerendered, `await connection()` first.

**Why the obvious alternatives fail** (worth a README paragraph — knowing this is expected at senior level):
`rewrites()` → frozen at build · `images.remotePatterns` → build-time *and* blocked by `dangerouslyAllowLocalIP` ·
`NEXT_PUBLIC_*` build args → inlined, needs a rebuild per environment · `sed`-replacing tokens in `.next` at
container start → works, but fragile and unreviewable.

### Server env (`server/.env.example`)

`NODE_ENV` `PORT=4000` `HOST` `API_GLOBAL_PREFIX` `API_DEFAULT_VERSION` ·
`DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` `DB_SSL` `DB_LOGGING` `DB_POOL_MAX` ·
`JWT_SECRET` `JWT_EXPIRES_IN` `JWT_ISSUER` `BCRYPT_SALT_ROUNDS` ·
`CORS_ORIGINS` `CORS_CREDENTIALS` · `RATE_LIMIT_TTL_MS` `RATE_LIMIT_LIMIT` `AUTH_RATE_LIMIT_LIMIT` ·
`UPLOAD_DIR` `UPLOAD_MAX_FILE_SIZE_BYTES` `UPLOAD_MAX_FILES` `UPLOAD_ALLOWED_MIME_TYPES` `PUBLIC_UPLOADS_PATH` ·
`LOG_LEVEL` `LOG_PRETTY` · `SWAGGER_ENABLED` `SWAGGER_PATH` · `ADMIN_EMAIL` `ADMIN_PASSWORD` · `SHUTDOWN_TIMEOUT_MS`

### Client env (`client/.env.example`) — all server-side only

`API_INTERNAL_URL` `API_UPLOADS_URL` `API_TIMEOUT_MS` `SESSION_COOKIE_NAME` `SESSION_COOKIE_SECURE`
`APP_NAME` `PORT` `NEXT_TELEMETRY_DISABLED`

### Zod, fail-fast at boot

**Zod over Joi:** Zod infers the TypeScript type from the schema, so `AppConfigService`'s types come free from one
declaration. Joi needs a hand-maintained parallel interface — a DRY violation you'd have to keep in sync.

```ts
export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGINS: z.string().transform(s => s.split(',').map(v => v.trim()).filter(Boolean)),
  // …
}).superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.includes('dev_only')) ctx.addIssue({ message: 'Refusing to boot: default JWT_SECRET in production' });
    if (env.ADMIN_PASSWORD === 'ChangeMe_Admin123!') ctx.addIssue({ message: 'Refusing to boot: default ADMIN_PASSWORD in production' });
  }
});
```

**`AppConfigService` is the only class that injects `ConfigService`**, exposing typed groups (`cfg.db`, `cfg.jwt`,
`cfg.uploads`, `cfg.cors`). README rule: *no `configService.get('SOME_STRING')` anywhere else.* That's SRP + DIP
applied to configuration, and it kills magic strings.

---

## 11. Docker

**`.dockerignore` in both** (`node_modules`, `.next`, `dist`, `coverage`, `.git`, `*.md`, `.env*`, `test`).
Without it the build context copies `node_modules` and the build is slow and possibly wrong.

**`server/Dockerfile`** — 5 stages (`base` → `deps` → `build` → `prod-deps` → `runner`) on `node:24-alpine`.
Runner carries prod deps + `dist` + `assets` only.
❗ `RUN mkdir -p /app/uploads && chown -R node:node /app` **before** `USER node` — a fresh named volume inherits
the image directory's ownership, and skipping this makes every upload fail with `EACCES`.
Healthcheck uses Node's global `fetch` — alpine ships neither `curl` nor `wget`.

**`client/Dockerfile`** — `output: 'standalone'` cuts the image ~10x.
❗ `server.js` does **not** copy `public` or `.next/static` — copying them manually is mandatory, and forgetting it
is the #1 "CSS and images are broken in Docker" bug.
**Zero build args** — no `NEXT_PUBLIC_*`, no API URL at build time. That's the payoff of §10.
*Checkpoint:* confirm `.next/standalone/server.js` exists after `npm run build` under Turbopack before relying on it.

**`docker-compose.yml`** (no `version:` key — obsolete in Compose v2+):

- `db` — `postgres:17-alpine`, `pg_isready` healthcheck, `pgdata` volume
- **`migrator`** — one-shot `node dist/database/cli.js migrate && … seed`, `restart: "no"`,
  gated on `db: service_healthy`
- `api` — gated on `migrator: service_completed_successfully`, `uploads` volume, `init: true`, `stop_grace_period: 15s`
- `web` — gated on `api: service_healthy`, `API_INTERNAL_URL: http://api:4000/api/v1`

**Why a dedicated `migrator` service** beats `migrationsRun: true`: migrations complete before the API accepts a
single request, the ordering is explicit in `docker compose logs`, it doesn't race if the API is ever scaled to 2
replicas, and it keeps the TypeORM CLI out of the runtime path.

**`docker compose up --build` must work on a freshly cloned repo with no setup** — every `${VAR}` has a `:-default`
and `server/.env.docker` is committed with dev-only values. That's the strongest reading of "a single command", and
it's what a reviewer will actually type. Caveat to document: those defaults are dev-only, and the env schema refuses
them when `NODE_ENV=production`.

Two compose gotchas to document: `${VAR}` interpolation reads the **root** `.env`/shell while `env_file:` injects into
the **container** — different systems, easily conflated; and `env_file` values are overridden by explicit `environment:` entries.

**Graceful shutdown:** `enableShutdownHooks()` + exec-form `CMD` (node is PID 1 and Nest registers SIGTERM) +
`init: true` + `stop_grace_period: 15s`.

---

## 12. Testing

**Server unit** — test where the logic is, not where the framework is:

| Spec | Proves |
|---|---|
| `apartments.service.spec.ts` | Pagination math, filter composition, 404, 409 mapping — against `InMemoryApartmentRepository`. **This suite is the payoff of the port abstraction.** |
| `auth.service.spec.ts` | 409 duplicate; *identical* 401 for unknown-email vs wrong-password; role always `normal`; hash never in the response |
| `apartment.mapper.spec.ts` | Image URLs composed from config; cover selection; no entity leakage |
| `roles.guard.spec.ts` · `all-exceptions.filter.spec.ts` | Admin/normal/`@Public`; PG `23505`→409, `LIMIT_FILE_SIZE`→413, unknown→500 with no stack leaked |
| `env.validation.spec.ts` · `local-disk-storage.spec.ts` · `search-query.spec.ts` | Missing/short `JWT_SECRET` throws · `../../etc/passwd` can't escape `UPLOAD_DIR` · `%`/`_` are escaped |

**Skip** controller unit tests with mocked services — near-zero value, covered by e2e.
Set an enforced `coverageThreshold` (global 70%, services 85%). A committed threshold is a checkable artifact; a
number in a README is not.

**Server e2e** — real Postgres via `@testcontainers/postgresql` in `globalSetup`/`globalTeardown`, `testTimeout: 60s`.
`npm run test:e2e` is then genuinely one command with no prerequisite beyond Docker, which the project already needs.
❗ **e2e must build the app through the same `configureApp(app)` as `main.ts`** (D7) — otherwise the tests validate a
configuration that doesn't ship. Reset with `TRUNCATE … RESTART IDENTITY CASCADE` between suites.
**Factories** with a deterministic incrementing counter, **not `@faker-js/faker`** — random data means flaky
assertions and unreproducible failures.

*Scenario matrix (mirrors the sequence diagrams — a nice documentation tie-in):* register 201 / 409 / weak-password 400 ·
login 200 / 401 / 401-same-body · list paging + meta · search by unit_name, by unit_number, by project name (three tests) ·
search with `%` returns no false positives · detail 200 / 404 / 400 · create 401 / 403 / 201 / 409 · patch · delete 204 then 404 ·
upload jpeg 201 / `.txt` 415 / 6 MB 413 · `/health` · login 429.

**Client** — Vitest 4 + Testing Library 16 + jsdom. *Why not Jest:* Next 16 defaults to Turbopack and `next/jest`
pulls in SWC/ESM config you'd debug instead of writing tests; `vitest.config.ts` is ~20 lines.
❗ **Async Server Components cannot be rendered by RTL** — test client components and pure functions only:
`search-filters` (debounce → one `router.replace`, `page` reset), `pagination` (hrefs preserve params, `aria-current`),
`apartment-card`, empty/error states, **`lib/utils/search-params.test.ts` (highest value per line)**, `lib/api/http.test.ts`.
Mock `next/image` to a plain `<img>`. Target 8–15 focused tests; don't chase client coverage.

**CI (Phase 7):** server lint + unit + e2e → client lint + typecheck + vitest → `docker compose build`.

---

## 13. Execution order

> The highest-leverage sequencing decision is **Docker before auth**. An app that runs in one command with fewer
> features beats a feature-complete app the reviewer can't start — and the one-command requirement is the first
> thing anyone will try.

| Phase | Deliverable | Priority |
|---|---|---|
| **0 — Foundation** (~½ day) | Nest 11 bump, deps, strict TS, delete scaffold controller/service, `config/` + Zod + `AppConfigService`, `bootstrap.ts`, `/health`, both `.env.example`, `PORT=4000`.<br>**Exit:** boots, `/health` 200, bad env fails fast with a readable message. | **MUST** |
| **1 — Data + read APIs** | DataSource, 3 entities, initial + search-index migrations, idempotent seed. Repository port + adapter, service, `GET /apartments` (pagination + search + filters), `GET /apartments/:id`. Mapper, DTOs, envelope interceptor, exception filter, Swagger. Unit + e2e.<br>**Exit:** seeded DB, two endpoints, `/api/docs` live. | **MUST** (graded core) |
| **2 — Frontend listing + detail** | Runtime-config plumbing, API client, layout/header, listing with debounced URL search + pagination, detail page, loading/error/not-found, skeletons, responsive Tailwind, `/uploads` route handler + `next/image`.<br>**Exit: the required functionality *plus* the bonus search is complete.** If everything after this failed, the submission still scores well. | **MUST** |
| **3 — Docker one-command** | Both Dockerfiles, compose, `migrator`, volumes, healthchecks, zero-setup defaults.<br>**Exit:** `git clone && docker compose up --build` → working app at `localhost:3000`. | **MUST** |
| **4 — Auth + admin CRUD + uploads** | users/auth modules, bcryptjs behind the port, JWT strategy, global guards + `@Public()`, seeded admin. POST/PATCH/DELETE, image upload + storage abstraction + static serving. Full auth/CRUD e2e. Client: login, session cookie handler, `/admin/*` with Server Actions. | SHOULD |
| **5 — Production hardening** | helmet (**with the CORP fix**), env-driven CORS allowlist, throttler, typed exception filter with error codes, `nestjs-pino` with `genReqId` + redaction of `authorization`/`password`, terminus DB check, `enableShutdownHooks`. | SHOULD |
| **6 — Coverage + documentation** | Fill test gaps, enforce thresholds, client Vitest suite. Root README: one-command quickstart, architecture diagram, folder map, **design decisions & tradeoffs**, **patterns rejected**, **deliberate non-goals**, env tables, API summary, how to run tests, "what I'd do next". **Update `InitialSystemDesign/` to match what shipped** (PATCH, `/api/v1/auth/*`, `projects` + `apartment_images`, soft delete). | SHOULD |
| **7 — Polish** | `openapi-typescript` client types, `docker-compose.dev.yml` hot reload, GitHub Actions CI, magic-byte validation, dark-mode toggle, blur placeholders. | NICE |

---

## 14. Conflicts between goals — and the calls made

1. **Full scope vs. polish, under "Functionality first."** Phases 1–3 deliver the *graded* assignment; Phase 4 delivers
   the extended scope. **If time runs out mid-Phase-4, ship what's done and describe the rest under "Non-goals /
   in progress."** Never submit a half-wired `/admin` route — a broken link costs more than a missing feature.
2. **Patterns vs. KISS.** Ports + adapters for 3 aggregates is right-sized; full hexagonal with duplicated models is not.
   Entities are the domain model, DTOs guard the outbound boundary, and the README carries "patterns I chose not to use,
   and why." **Without that section a reviewer cannot distinguish restraint from ignorance — the section *is* the deliverable.**
3. **"Nothing hardcoded" vs. Next's build-time inlining.** Genuinely in tension. Resolved by zero `NEXT_PUBLIC_*` +
   same-origin proxy handlers + runtime config provider (§10). Sub-conflict: the purest form (no defaults anywhere)
   fights "one command on a clean clone" — resolved by allowing dev defaults in *compose interpolation only*, while the
   app's own schema still fails fast and refuses dev secrets in production.
4. **Normalized `projects` vs. the published ERD's string column.** Deviating from your own design doc is fine; leaving
   both versions in the repo is worse than either. Normalize, and update `erd.md` in Phase 6.
5. **Soft delete vs. the diagram's literal `DELETE FROM`.** Same resolution — update the diagram.
6. **Envelope vs. Swagger ergonomics.** Keep the envelope (consistency wins); solve typing once with a reusable
   `ApiPaginatedResponse` decorator rather than per-endpoint hand-written schemas.
7. **Two-endpoint create vs. one multipart endpoint.** Split server-side, hidden behind one client function.
8. **Native `bcrypt` vs `bcryptjs`.** `bcryptjs`, behind the port so it's a one-line swap.
9. **`typeorm@1.1.0` vs `0.3.31`.** `^0.3.31`, documented.
10. **`@nestjs/swagger@11` needs Nest 11.** Bump in Phase 0 rather than pinning the whole ecosystem backwards.

---

## 15. Verification

- **One command:** `docker compose up --build` on a clean clone → all services healthy, DB migrated and seeded.
- **API:** listing `meta` correctness · detail 200/404 · search hits by unit name, unit number, *and* project name ·
  `?search=%` returns no false positives · `POST` unauthenticated 401 → normal-user 403 → admin 201 → 409 on duplicate ·
  upload jpeg 201 / `.txt` 415 / oversize 413 · Swagger at `/api/docs`.
- **Frontend:** search updates the URL and survives reload + back-navigation · responsive at 360/768/1024/1440 ·
  skeletons on slow navigation · bad id → `not-found.tsx` · **images actually render in compose** (the CORP and
  `dangerouslyAllowLocalIP` traps both surface here).
- **Tests:** `npm test` + `npm run test:e2e` in `server/`, `npm test` in `client/`.
- **No-hardcoding audit:** grep both `src/` trees for `localhost`, `postgres://`, `http://`, and literal ports — hits
  should appear only in `.env.example` and docs. Then re-run the stack with changed ports and DB credentials to prove
  nothing was baked in.
