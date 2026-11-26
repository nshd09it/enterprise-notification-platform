# Enterprise Notification Platform

Full-stack monorepo for reliable multi-channel notification ingestion, queueing, and delivery tracking.

## Architecture

- **`apps/api`**: NestJS 11 REST API + Swagger docs (`/docs`), Prisma persistence, and BullMQ job enqueueing.
- **`apps/worker`**: BullMQ worker with exponential backoff retries, Dead Letter Queue (DLQ), delivery attempt logging, and pluggable providers (`Email` via Nodemailer/SMTP, `Webhook` with HMAC-SHA256 signing, `SMS`, and `Push`).
- **`apps/web`**: React 18 + Vite + TypeScript + Tailwind CSS dashboard for composing notifications, monitoring metrics, and retrying failed deliveries.
- **`libs/database`**: PostgreSQL + Prisma schema, singleton client, and seed script.
- **`libs/queue`**: Shared Redis (`ioredis`) and BullMQ queue/DLQ utilities.
- **`libs/contracts`**: Shared TypeScript interfaces across API, worker, and libraries.

## Quick Start

1. **Copy environment variables**:
   ```bash
   cp .env.example .env
   ```

2. **Start PostgreSQL, Redis, and Mailpit (local SMTP UI)**:
   ```bash
   pnpm docker:up
   ```

3. **Install dependencies and set up the database**:
   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

4. **Run the API, Worker, and React Frontend** (in separate terminals):
   ```bash
   pnpm dev:api      # http://localhost:3001 (Swagger at /docs)
   pnpm dev:worker   # BullMQ worker consuming 'notifications' queue
   pnpm dev:web      # http://localhost:5173
   ```

5. **Inspect delivered emails locally**:
   Open Mailpit at `http://localhost:8025`.
