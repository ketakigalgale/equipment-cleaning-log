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
- A PostgreSQL instance (local install, or via Docker - see below)

## Option A: Run everything with Docker Compose (recommended, one command)

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

## Option B: Run locally without Docker

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
