# Test Case Management System

A full-stack test case management application built as a service-oriented architecture (SOA): an API gateway in front of three backend microservices, a React 18 frontend, PostgreSQL, and Redis caching.

## Architecture

```
React (Vite)  ──HTTPS──>  Gateway (4000, public)
                             ├── /api/auth/*  ──>  Auth Service (4002)      ──HTTP──> DB Service (4001) ──> PostgreSQL
                             └── /api/*       ──>  User Service (4003)      ──HTTP──> DB Service (4001) ──> PostgreSQL
                                                         │
                                                         └──> Redis (caching)
```

- **gateway**: single public entry point. Routes `/api/auth/*` to auth-service and everything else under `/api/*` to user-service. Handles CORS and security headers, serves Swagger docs at `/api-docs`.
- **auth-service**: registration, login, JWT issuing. Rate-limited to 5 requests/15min. Never touches Postgres directly — calls db-service.
- **user-service**: all business domain logic (projects, test cases, test suites, test executions, analytics). Enforces RBAC via JWT claims, owns Redis caching and cache invalidation. Never touches Postgres directly — calls db-service.
- **db-service**: the **only** service with a Postgres connection (Prisma). Exposes an internal-only REST API, protected by a shared `INTERNAL_API_KEY` header, called exclusively by auth-service and user-service.

Only the gateway is exposed publicly in deployment; the other three services communicate over a private network.

## Roles (RBAC)

| Role | Projects | Test Cases/Suites | Execute Tests | Users | Dashboards |
|---|---|---|---|---|---|
| `admin` | full | full | yes | full | yes |
| `test_lead` | create/edit | full | yes | no | yes |
| `tester` | view | view | yes | no | yes |
| `read_only` | view | view | no | no | yes |

## Local development

Requires Docker Desktop and Node 20+.

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, Redis, and all four backend services. On first run, apply the schema and seed demo data:

```bash
cd services/db-service
cp .env.example .env            # DATABASE_URL points at localhost:5432
npm install
npx prisma migrate deploy
node prisma/seed.js
```

Then run the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

## Demo credentials

All seeded accounts use password `Demo@1234`.

| Role | Email |
|---|---|
| admin | admin@demo.com |
| test_lead | lead@demo.com |
| tester | tester@demo.com |
| read_only | readonly@demo.com |

A sample project ("E-Commerce Platform") is seeded with 15 test cases, a smoke suite, and execution history across all four result statuses.

## API documentation

Swagger UI is served by the gateway at `/api-docs` (e.g. http://localhost:4000/api-docs).

## Caching

- Analytics (`/api/analytics/:projectId`) — 15 minutes
- Test suite lists (`/api/test-suites`) — 30 minutes
- Project metadata (`/api/projects/:id`) — 1 hour

Cache entries are explicitly invalidated by user-service on the relevant write (project update/delete, suite create, execution create).

## Rate limiting

| Endpoint group | Limit |
|---|---|
| `/api/auth/*` | 5 requests / 15 min |
| Test case CRUD | 100 requests / hour |
| Test execution | 200 requests / hour |
| Analytics | 50 requests / hour |

## Security

- Passwords hashed with bcrypt; JWTs signed with a shared secret, verified independently by user-service.
- Prisma parameterizes all queries (SQL injection protection); request bodies validated with `zod` at the auth boundary.
- `helmet` security headers and CORS locked to the frontend origin at the gateway.
- Internal service-to-service calls require a shared `INTERNAL_API_KEY` header; db-service rejects any request without it.

## Deployment

Each of the four backend folders (`services/gateway`, `services/auth-service`, `services/user-service`, `services/db-service`) has its own `Dockerfile` and is deployable as an independent service on Railway (or any platform supporting multiple services + private networking per project). Only `gateway` needs a public domain — the rest should stay on the project's private network.

1. Create a Railway project, add a Postgres and a Redis plugin.
2. Deploy `services/db-service` first; set `DATABASE_URL` (from the Postgres plugin) and a strong `INTERNAL_API_KEY`. Run `npx prisma migrate deploy && node prisma/seed.js` once via Railway's shell.
3. Deploy `services/auth-service` and `services/user-service`; set `DB_SERVICE_URL` to db-service's private URL, the same `INTERNAL_API_KEY`, the same `JWT_SECRET`, and (for user-service) `REDIS_URL` from the Redis plugin.
4. Deploy `services/gateway`; set `AUTH_SERVICE_URL` / `USER_SERVICE_URL` to their private URLs and `CORS_ORIGIN` to the deployed frontend's URL. Generate a public domain for this service only.
5. Deploy `frontend` to Vercel; set `VITE_API_URL` to the gateway's public URL + `/api`.

## Project structure

```
services/
  gateway/        # public API gateway + Swagger docs
  auth-service/   # authentication, JWT issuing
  user-service/   # business logic, RBAC, Redis caching
  db-service/     # sole Postgres/Prisma access point
frontend/         # React 18 + Vite SPA
docker-compose.yml
```
