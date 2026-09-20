# Equipment Cleaning Log

A small full-stack app for logging equipment cleaning records with a full, field-level
audit trail: PostgreSQL + Node/TypeScript/Express API + React/TypeScript front-end.

## Stack

- **Database:** PostgreSQL, schema managed with Prisma migrations.
- **API:** Node.js, TypeScript, Express, Prisma Client, Zod for validation.
- **Front-end:** React, TypeScript, Vite (no extra state/routing libraries - see NOTES.md).
- **Tests:** Vitest on both sides (+ React Testing Library on the front-end).

## Prerequisites

- Node.js 20+ and npm
- A PostgreSQL instance - any of the following work: a free hosted instance (Supabase,
  Neon), a local install, or Docker. This project was built and verified end-to-end
  against a free Supabase Postgres instance (see Option A below).

## Option A: Run against a hosted Postgres (Supabase or Neon) - no local DB install

This is the path actually used to build and test this project.

1. Create a free project at [supabase.com](https://supabase.com) (or [neon.tech](https://neon.tech)).
2. Get the connection string. On Supabase: click **Connect** on the project dashboard,
   choose **URI** format, and pick the **Session pooler** option (not "Direct connection")
   - Supabase's direct connection host requires IPv6, which most home/office networks
     don't have; the session pooler works over IPv4. It looks like:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
3. If your database password contains special characters (`@`, `#`, etc.), URL-encode
   them - e.g. a literal `@` in the password must become `%40`, or the connection string
   won't parse correctly.
4. Set up and run the API:
   ```bash
   cd backend
   cp .env.example .env   # then paste your real connection string into DATABASE_URL
   npm install
   npm run prisma:migrate:deploy   # applies the committed migration to your DB
   npm run prisma:seed             # loads sample equipment + cleaning records
   npm run dev                     # starts the API on http://localhost:4000
   ```
5. In a second terminal, run the front-end:
   ```bash
   cd frontend
   npm install
   npm run dev                     # starts the web app on http://localhost:5173
   ```
6. Open http://localhost:5173.

## Option B: Run everything with Docker Compose (one command, untested against a real Docker install for this submission - see NOTES.md)

```bash
docker compose up --build
```

This starts Postgres, runs migrations, and starts the API and the web app.

- Web: http://localhost:5173
- API: http://localhost:4000/api
- Postgres: localhost:5432 (user/pass: `postgres`/`postgres`, db: `equipment_cleaning_log`)

The API container runs `prisma migrate deploy` on startup, so the schema is created
automatically. To seed sample data after the stack is up:

```bash
docker compose exec api npm run prisma:seed
```

## Option C: Run locally without Docker, against a local Postgres install

### 1. Database

Create a Postgres database, e.g.:

```bash
createdb equipment_cleaning_log
```

### 2. API

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL if your Postgres setup differs
npm install
npm run prisma:migrate:deploy   # applies the committed migration
npm run prisma:seed             # optional: sample equipment + cleaning records
npm run dev                     # starts the API on http://localhost:4000
```

### 3. Front-end

In a second terminal:

```bash
cd frontend
npm install
npm run dev                     # starts the web app on http://localhost:5173
```

By default the front-end calls `http://localhost:4000/api`. To point it elsewhere,
create `frontend/.env` with `VITE_API_URL=http://your-host:port/api`.

## Running the tests

```bash
cd backend && npm test
cd frontend && npm test
```

Backend tests cover the audit-diff logic (`src/lib/auditDiff.ts`), pagination
(`src/lib/pagination.ts`), and the cleaning-record service's orchestration (create/update
audit writes, pagination, status filtering) against an in-memory fake Prisma client - no
live database is required to run them. Front-end tests cover the audit trail table and
pagination controls.

## API overview

All responses are JSON. Mutating requests read an `X-Actor` header for "who made this
change" (see NOTES.md - there's no real auth in this app).

| Method | Path                                             | Description                              |
| ------ | ------------------------------------------------ | ----------------------------------------- |
| GET    | `/api/equipment?status=`                         | List equipment, optional status filter    |
| POST   | `/api/equipment`                                 | Create equipment                          |
| GET    | `/api/equipment/:id`                             | Get one equipment record                  |
| PUT    | `/api/equipment/:id`                             | Update equipment                          |
| DELETE | `/api/equipment/:id`                             | Delete equipment (blocked if it has records) |
| GET    | `/api/equipment/:id/cleaning-records?page=&limit=&status=` | Paginated, filterable cleaning records |
| POST   | `/api/equipment/:id/cleaning-records`            | Create a cleaning record (writes audit)   |
| PUT    | `/api/cleaning-records/:id`                      | Update a cleaning record (writes audit)   |
| GET    | `/api/cleaning-records/:id/audit`                | Field-level audit history, newest first   |

Errors are returned as `{ "error": { "message": string, "details"?: unknown } }` with an
appropriate status code (400 validation, 404 not found, 409 conflict).

## Project layout

```
backend/
  prisma/          schema, migration, seed script
  src/
    lib/           pure logic: auditDiff, pagination, errors
    schemas/       Zod request validation
    services/      business logic (DB access via injected PrismaClient)
    routes/        Express route wiring
  tests/
frontend/
  src/
    api/           fetch client
    components/    presentational + small stateful components
    pages/         EquipmentListPage, EquipmentDetailPage
    context/       "current user" (ActorContext)
    tests/
```

See `NOTES.md` for design decisions, trade-offs, and what was deliberately left out.
