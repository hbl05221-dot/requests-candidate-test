using Microsoft.EntityFrameworkCore;
using Requests.Application.Requests;
using Requests.Domain.Entities;
using Requests.Infrastructure.Persistence;

namespace Requests.Infrastructure.Repositories;

public sealed class RequestRepository : IRequestRepository
{
    private readonly RequestsDbContext _db;

    public RequestRepository(RequestsDbContext db)
    {
        _db = db;
    }

    public Task<List<Request>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _db.Requests.ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<Request>> SearchAsync(
        SearchRequestsQuery query,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        // Build a composable query – nothing hits the DB until CountAsync / ToListAsync
        IQueryable<Request> q = _db.Requests;

        // Authorization – applied first to minimize the working set
        if (!isAdmin)
            q = q.Where(x => x.OwnerId == userId || x.AssignedToUserId == userId);

        // Filters
        if (!string.IsNullOrWhiteSpace(query.RequestNumber))
            q = q.Where(x => x.RequestNumber.Contains(query.RequestNumber.Trim()));

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
            (SortField.RequestNumber, false)  => q.OrderBy(x => x.RequestNumber),
            (SortField.RequestNumber, true)   => q.OrderByDescending(x => x.RequestNumber),
            (SortField.Status,        false)  => q.OrderBy(x => x.Status),
            (SortField.Status,        true)   => q.OrderByDescending(x => x.Status),
            (SortField.RequestType,   false)  => q.OrderBy(x => x.RequestType),
            (SortField.RequestType,   true)   => q.OrderByDescending(x => x.RequestType),
            (_,                       false)  => q.OrderBy(x => x.CreatedAt),
            _                                 => q.OrderByDescending(x => x.CreatedAt),
        };

        // Pagination – two queries: count + page
        var pageSize   = Math.Clamp(query.PageSize, 1, 100);
        var page       = Math.Max(query.Page, 1);
        var totalCount = await q.CountAsync(cancellationToken);
        var items      = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Request>
        {
            Items      = items,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize,
        };
    }
}
