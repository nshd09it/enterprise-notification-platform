# ADR-001: Modular Monolith with Separate Worker

## Status

Accepted

## Context

The notification platform requires HTTP APIs and asynchronous notification
processing.

We want clear module boundaries without introducing the operational
complexity of multiple independently deployed microservices.

## Decision

We will implement:

- A modular NestJS API application.
- A separate background worker application.
- Shared domain and contract libraries.
- PostgreSQL as the primary database.
- Redis and BullMQ for asynchronous job processing.

## Consequences

### Positive

- Clear separation between API and background processing.
- Easier local development.
- Shared domain contracts.
- Simpler deployment and debugging than an initial microservice architecture.

### Trade-offs

- API and worker share the same repository.
- Module boundaries must be enforced through code review and dependency rules.
- Some future workloads may require independent services.
