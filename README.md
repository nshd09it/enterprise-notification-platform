# Enterprise Notification Platform

A production-style, multi-tenant notification platform built with TypeScript, Node.js, PostgreSQL, Redis, and React.

## Project Goals

Demonstrate practical software engineering concepts:

- Multi-tenant SaaS architecture
- Secure organization-level authorization
- REST API development
- Asynchronous notification delivery
- Transactional outbox pattern
- Idempotency and retry mechanisms
- Provider abstraction
- Automated testing
- Docker-based development
- CI/CD automation

## Architecture

The platform consists of:

- **API:** Handles authentication, authorization, and notification requests.
- **Worker:** Processes asynchronous notification delivery.
- **PostgreSQL:** Stores organizations, users, notifications, and delivery records.
- **Redis:** Supports background job processing.
- **Web application:** Provides notification management and operational visibility.

## Technology Stack

- TypeScript
- Node.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- React
- Docker
- GitHub Actions

## Repository Structure

```text
apps/
  api/
  worker/
  web/

libs/
  contracts/
  domain/
  database/
  queue/
  logger/
  config/

docs/
infrastructure/
```

## Development Status

Initial repository setup in progress.

Features will be marked complete only after implementation and testing.

## Running Locally

Local development setup instructions will be added as infrastructure and application components are implemented.

## Project Type

Independent portfolio demonstration project. It is not a production service or a representation of a previous employer's proprietary implementation.
