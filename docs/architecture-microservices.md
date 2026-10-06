# Architecture – Microservices & Messaging (Part B)

## Domain Breakdown

| Service       | Responsibility                                  |
|---------------|-------------------------------------------------|
| Customers     | Customer profile, identity                      |
| **Requests**  | Core domain – create, update, search requests   |
| Notifications | Send emails/push/SMS; persists notification log |
| Documents     | Upload, store, retrieve documents               |
| Reporting     | Aggregated reports (read-only, eventual)        |

Each service owns its own database – no shared schema.

---

## Reliable Messaging: Outbox Pattern

**Problem:** When a Request is created or changes status, a Notification must be sent.
The Notifications service may be temporarily unavailable.
A direct HTTP call would lose the event. A naive "write to DB then publish to queue" has a
dual-write race condition.

**Solution: Transactional Outbox**

```
┌──────────────────────────────────────────┐
│  Requests Service (single DB transaction) │
│                                           │
│  1. INSERT INTO requests ...              │
│  2. INSERT INTO outbox_events (payload)   │
│                                           │
│  COMMIT  ← atomic, all-or-nothing        │
└──────────┬───────────────────────────────┘
           │
           │  Background Outbox Publisher (polling / CDC)
           ▼
      ┌─────────┐        ┌───────────────────────┐
      │   SQS   │───────▶│  Notifications Service │
      └─────────┘        └───────────────────────┘
```

### Steps
1. **Write phase** – domain event is written to `outbox_events` table in the
   *same transaction* as the business change. Atomicity guaranteed by the DB.
2. **Publish phase** – a background worker (or Debezium CDC) reads unpublished
   events, publishes to SQS, and marks them `published_at`.
3. **Consume phase** – Notifications Service consumes from SQS.
   If it is down, messages wait durably in the queue (up to 14 days with SQS).
4. **Idempotency** – because we get at-least-once delivery, Notifications Service
   deduplicates by `event_id` before sending.

### Guarantees
- **No lost events** – event is in the DB before the API returns 200.
- **Notifications downtime** – queue absorbs the backlog; no data loss.
- **Decoupled** – Requests Service has no compile-time dependency on Notifications.
