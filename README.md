# CandidateTest – Requests System

## How to Run

### Backend (.NET 10)

```bash
cd src/Requests.Api
dotnet run
```

The API starts on a dynamic port shown in the console output, e.g. `http://localhost:60702`.  
Swagger UI is available at `http://localhost:<port>/swagger`.

> **Important:** Copy the HTTP port from the console and update line 4 of  
> `frontend/src/api/requestsApi.ts` if it differs from the default:
> ```ts
> const BASE_URL = 'http://localhost:60702/api/requests';
> ```

The in-memory database is seeded automatically on startup with 500 requests.

### Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.  
The API base URL is hardcoded in `frontend/src/api/requestsApi.ts` (`http://localhost:5056`).  
Update it if your backend port differs.

**Auth simulation** (no real auth in the exercise):  
Edit the two constants at the top of `requestsApi.ts`:

```ts
const X_USER_ID  = '1';      // change to any user id
const X_IS_ADMIN = 'true';   // 'false' to test regular-user filtering
```

### Tests

```bash
cd tests/Requests.Tests
dotnet test
```

---

## Technologies Chosen

| Area       | Choice                          | Why                                                                      |
|------------|---------------------------------|--------------------------------------------------------------------------|
| Backend    | .NET 10 / ASP.NET Core (existing)| Kept the existing stack; upgraded from net8.0 to net10.0 to match installed runtime |
| ORM        | EF Core InMemory                | Already configured; swappable for SQL Server/PostgreSQL with one line     |
| Frontend   | React 18 + Vite + TypeScript    | Faster DX than Angular for a focused PoC; minimal boilerplate            |
| State      | useState / useEffect (no Redux) | No cross-component state sharing needed; Redux would be over-engineering  |
| Styling    | Inline styles (no CSS-in-JS lib)| Zero extra dependencies for an exercise                                  |
| Tests      | xUnit (existing)                | Already in the project; familiar in .NET ecosystem                       |

---

## Assumptions

- Authentication is simulated via `X-User-Id` and `X-Is-Admin` headers (per the exercise instructions).
- "Millions of records" requirement is addressed architecturally (IQueryable + server-side pagination), even though the seed data is only 500 rows.
- PageSize is capped at 100 to prevent unbounded queries.
- `DateFrom` / `DateTo` filters are inclusive of the full day (normalized to midnight / end-of-day).
- The existing `GET /api/requests` endpoint was kept unchanged for backward compatibility.

---

## Key Technical Decision: IQueryable vs. in-memory filtering

The existing code called `GetAllAsync()` which loaded **all rows** into memory and then filtered in C#.  
This works with 500 rows but collapses with millions.

**Alternative considered:** Keep `GetAllAsync` and add LINQ filtering in the service layer.  
**Why I didn't:** Any filter applied after `ToList()` runs in process memory, not in the database.  
With millions of rows that means loading gigabytes of data on every request.

**What I did instead:** Added `SearchAsync` on the repository that builds an `IQueryable<Request>` and applies every filter—including the authorization predicate—**before** calling `ToListAsync()`. EF Core translates the entire chain to a single parameterised SQL query with `WHERE`, `ORDER BY`, `OFFSET`, and `FETCH`.

The trade-off is a slightly more complex repository contract (`SearchAsync` vs `GetAllAsync`), but the performance gain is non-negotiable at scale.

---

## What I Didn't Finish / Would Continue

| Item | Status | How I'd continue |
|------|--------|-----------------|
| Real authentication (JWT) | Not implemented | Replace header simulation with ASP.NET Core JWT bearer middleware; inject `ICurrentUserService` into the service layer |
| Frontend auth simulation as a UI toggle | Partial | Add a small "logged in as" selector in the UI instead of a hardcoded constant |
| Integration tests | Not added | Add `WebApplicationFactory<Program>` tests that exercise the full HTTP stack including CORS and header parsing |
| Database migration to SQL Server/PostgreSQL | Not done | Replace `UseInMemoryDatabase` with `UseSqlServer` / `UseNpgsql` + `dotnet ef migrations add Initial` |
| ElastiCache / Redis caching for search | Not implemented | Cache hot search queries with a short TTL; invalidate on write |
| CI/CD pipeline | Not added | GitHub Actions: build → test → push ECR → deploy ECS |
