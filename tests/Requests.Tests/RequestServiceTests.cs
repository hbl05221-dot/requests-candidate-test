using Requests.Application.Requests;
using Requests.Domain.Entities;
using Xunit;

namespace Requests.Tests;

public class RequestServiceTests
{
    // ── Existing tests (unchanged behaviour) ─────────────────────────────────

    [Fact]
    public async Task Administrator_CanSeeAllRequests()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 2),
            Create(2, ownerId: 3, assignedTo: 4)
        ]);

        var service = new RequestService(repository);
        var result  = await service.GetRequestsAsync(1, isAdministrator: true);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task RegularUser_CanSeeOwnedOrAssignedRequests()
    {
        var repository = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 5),
            Create(2, ownerId: 3, assignedTo: 1),
            Create(3, ownerId: 3, assignedTo: 5)
        ]);

        var service = new RequestService(repository);
        var result  = await service.GetRequestsAsync(1, isAdministrator: false);

        Assert.Equal(2, result.Count);
        Assert.DoesNotContain(result, x => x.Id == 3);
    }

    // ── Search: authorization ─────────────────────────────────────────────────

    [Fact]
    public async Task Search_Administrator_SeesAllResults()
    {
        var repo = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 2),
            Create(2, ownerId: 3, assignedTo: 4),
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(new SearchRequestsQuery(), currentUserId: 99, isAdministrator: true);

        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task Search_RegularUser_SeesOnlyOwnedOrAssigned()
    {
        var repo = new FakeRequestRepository(
        [
            Create(1, ownerId: 1, assignedTo: 5),   // owned by user 1
            Create(2, ownerId: 3, assignedTo: 1),   // assigned to user 1
            Create(3, ownerId: 3, assignedTo: 5),   // neither
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(new SearchRequestsQuery(), currentUserId: 1, isAdministrator: false);

        Assert.Equal(2, result.TotalCount);
        Assert.DoesNotContain(result.Items, x => x.Id == 3);
    }

    // ── Search: filters ───────────────────────────────────────────────────────

    [Fact]
    public async Task Search_ByRequestNumber_ReturnsPartialMatch()
    {
        var repo = new FakeRequestRepository(
        [
            CreateFull(1, "REQ-000001", RequestStatus.New,       RequestType.General,  DateTime.UtcNow),
            CreateFull(2, "REQ-000002", RequestStatus.New,       RequestType.General,  DateTime.UtcNow),
            CreateFull(3, "OTHER-0001", RequestStatus.New,       RequestType.General,  DateTime.UtcNow),
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(
            new SearchRequestsQuery { RequestNumber = "REQ" },
            currentUserId: 1, isAdministrator: true);

        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, x => Assert.Contains("REQ", x.RequestNumber));
    }

    [Fact]
    public async Task Search_ByStatus_SingleStatus_ReturnsMatching()
    {
        var repo = new FakeRequestRepository(
        [
            CreateFull(1, "REQ-001", RequestStatus.New,       RequestType.General, DateTime.UtcNow),
            CreateFull(2, "REQ-002", RequestStatus.InProgress, RequestType.General, DateTime.UtcNow),
            CreateFull(3, "REQ-003", RequestStatus.Completed,  RequestType.General, DateTime.UtcNow),
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(
            new SearchRequestsQuery { Statuses = [RequestStatus.New] },
            currentUserId: 1, isAdministrator: true);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal(RequestStatus.New, result.Items[0].Status);
    }

    [Fact]
    public async Task Search_ByStatus_MultipleStatuses_ReturnsAll()
    {
        var repo = new FakeRequestRepository(
        [
            CreateFull(1, "REQ-001", RequestStatus.New,        RequestType.General, DateTime.UtcNow),
            CreateFull(2, "REQ-002", RequestStatus.InProgress,  RequestType.General, DateTime.UtcNow),
            CreateFull(3, "REQ-003", RequestStatus.Completed,   RequestType.General, DateTime.UtcNow),
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(
            new SearchRequestsQuery { Statuses = [RequestStatus.New, RequestStatus.InProgress] },
            currentUserId: 1, isAdministrator: true);

        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task Search_ByDateRange_ReturnsOnlyWithinRange()
    {
        var today     = DateTime.UtcNow.Date;
        var repo = new FakeRequestRepository(
        [
            CreateFull(1, "REQ-001", RequestStatus.New, RequestType.General, today.AddDays(-10)),
            CreateFull(2, "REQ-002", RequestStatus.New, RequestType.General, today.AddDays(-5)),
            CreateFull(3, "REQ-003", RequestStatus.New, RequestType.General, today.AddDays(-1)),
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(
            new SearchRequestsQuery { DateFrom = today.AddDays(-6), DateTo = today.AddDays(-2) },
            currentUserId: 1, isAdministrator: true);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal(2, result.Items[0].Id);
    }

    [Fact]
    public async Task Search_ByRequestType_ReturnsMatching()
    {
        var repo = new FakeRequestRepository(
        [
            CreateFull(1, "REQ-001", RequestStatus.New, RequestType.Legal,   DateTime.UtcNow),
            CreateFull(2, "REQ-002", RequestStatus.New, RequestType.Payment, DateTime.UtcNow),
        ]);
        var service = new RequestService(repo);

        var result = await service.SearchRequestsAsync(
            new SearchRequestsQuery { RequestType = RequestType.Legal },
            currentUserId: 1, isAdministrator: true);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal(RequestType.Legal, result.Items[0].RequestType);
    }

    // ── Search: validation ────────────────────────────────────────────────────

    [Fact]
    public async Task Search_DateFromAfterDateTo_ThrowsArgumentException()
    {
        var service = new RequestService(new FakeRequestRepository([]));

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SearchRequestsAsync(
                new SearchRequestsQuery
                {
                    DateFrom = DateTime.UtcNow.AddDays(1),
                    DateTo   = DateTime.UtcNow.AddDays(-1),
                },
                currentUserId: 1, isAdministrator: true));
    }

    // ── Search: pagination ────────────────────────────────────────────────────

    [Fact]
    public async Task Search_Pagination_ReturnsCorrectPage()
    {
        // 5 records, page size 2, page 2 → should return items 3 & 4
        var records = Enumerable.Range(1, 5)
            .Select(i => CreateFull(i, $"REQ-{i:000}", RequestStatus.New, RequestType.General, DateTime.UtcNow.AddDays(-i)))
            .ToList();

        var service = new RequestService(new FakeRequestRepository(records));

        var result = await service.SearchRequestsAsync(
            new SearchRequestsQuery { Page = 2, PageSize = 2, SortBy = SortField.RequestNumber, SortDescending = false },
            currentUserId: 1, isAdministrator: true);

        Assert.Equal(5, result.TotalCount);
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(3, result.TotalPages);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Request Create(int id, int ownerId, int assignedTo)
        => new()
        {
            Id               = id,
            RequestNumber    = $"REQ-{id:000}",
            CustomerId       = id,
            OwnerId          = ownerId,
            AssignedToUserId = assignedTo,
            Status           = RequestStatus.New,
            RequestType      = RequestType.General,
            CreatedAt        = DateTime.UtcNow,
        };

    private static Request CreateFull(
        int id, string number, RequestStatus status, RequestType type, DateTime createdAt,
        int ownerId = 1, int? assignedTo = null)
        => new()
        {
            Id               = id,
            RequestNumber    = number,
            CustomerId       = id,
            OwnerId          = ownerId,
            AssignedToUserId = assignedTo,
            Status           = status,
            RequestType      = type,
            CreatedAt        = createdAt,
            UpdatedAt        = createdAt,
        };

    // ── Fake Repository ───────────────────────────────────────────────────────

    private sealed class FakeRequestRepository : IRequestRepository
    {
        private readonly List<Request> _requests;

        public FakeRequestRepository(List<Request> requests) => _requests = requests;

        public Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_requests);

        public Task<PagedResult<Request>> SearchAsync(
            SearchRequestsQuery query,
            int userId,
            bool isAdmin,
            CancellationToken cancellationToken = default)
        {
            // Mirror the real repository logic in-memory so tests stay fast and isolated.
            IEnumerable<Request> q = _requests;

            if (!isAdmin)
                q = q.Where(x => x.OwnerId == userId || x.AssignedToUserId == userId);

            if (!string.IsNullOrWhiteSpace(query.RequestNumber))
                q = q.Where(x => x.RequestNumber.Contains(query.RequestNumber.Trim(), StringComparison.OrdinalIgnoreCase));

            if (query.Statuses.Count > 0)
                q = q.Where(x => query.Statuses.Contains(x.Status));

            if (query.DateFrom.HasValue)
                q = q.Where(x => x.CreatedAt >= query.DateFrom.Value.Date);

            if (query.DateTo.HasValue)
                q = q.Where(x => x.CreatedAt < query.DateTo.Value.Date.AddDays(1));

            if (query.RequestType.HasValue)
                q = q.Where(x => x.RequestType == query.RequestType.Value);

            // Sorting
            q = (query.SortBy, query.SortDescending) switch
            {
                (SortField.RequestNumber, false) => q.OrderBy(x => x.RequestNumber),
                (SortField.RequestNumber, true)  => q.OrderByDescending(x => x.RequestNumber),
                (SortField.Status,        false) => q.OrderBy(x => x.Status),
                (SortField.Status,        true)  => q.OrderByDescending(x => x.Status),
                (SortField.RequestType,   false) => q.OrderBy(x => x.RequestType),
                (SortField.RequestType,   true)  => q.OrderByDescending(x => x.RequestType),
                (_,                       false) => q.OrderBy(x => x.CreatedAt),
                _                                => q.OrderByDescending(x => x.CreatedAt),
            };

            var list      = q.ToList();
            var total     = list.Count;
            var pageSize  = Math.Clamp(query.PageSize, 1, 100);
            var page      = Math.Max(query.Page, 1);
            var items     = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Task.FromResult(new PagedResult<Request>
            {
                Items      = items,
                TotalCount = total,
                Page       = page,
                PageSize   = pageSize,
            });
        }
    }
}
