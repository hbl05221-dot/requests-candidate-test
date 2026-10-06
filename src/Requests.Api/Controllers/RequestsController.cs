using Microsoft.AspNetCore.Mvc;
using Requests.Application.Requests;
using Requests.Domain.Entities;

namespace Requests.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly IRequestService _service;

    public RequestsController(IRequestService service)
    {
        _service = service;
    }

    // For the exercise, the current user is supplied through headers:
    // X-User-Id: integer
    // X-Is-Admin: true|false

    /// <summary>Returns all requests visible to the caller (no filters).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RequestDto>>> Get(
        CancellationToken cancellationToken)
    {
        var (userId, isAdmin) = ReadUserContext();
        var result = await _service.GetRequestsAsync(userId, isAdmin, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Search and filter requests with pagination.
    /// All query parameters are optional.
    /// </summary>
    /// <remarks>
    /// Supported query params:
    ///   requestNumber   – partial match (e.g. "REQ-000")
    ///   statuses        – comma-separated list, e.g. "New,InProgress"
    ///   dateFrom        – ISO date, inclusive (e.g. "2024-01-01")
    ///   dateTo          – ISO date, inclusive (e.g. "2024-12-31")
    ///   requestType     – General | Legal | Payment | Appeal
    ///   sortBy          – CreatedAt | RequestNumber | Status | RequestType (default: CreatedAt)
    ///   sortDescending  – true | false (default: true)
    ///   page            – 1-based (default: 1)
    ///   pageSize        – 1-100 (default: 20)
    /// </remarks>
    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<RequestDto>>> Search(
        [FromQuery] string? requestNumber,
        [FromQuery] string? statuses,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] RequestType? requestType,
        [FromQuery] SortField sortBy = SortField.CreatedAt,
        [FromQuery] bool sortDescending = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        // ── Validate numeric inputs ───────────────────────────────────────────
        if (page < 1)
            return BadRequest("page must be >= 1.");

        if (pageSize is < 1 or > 100)
            return BadRequest("pageSize must be between 1 and 100.");

        // ── Parse comma-separated statuses ────────────────────────────────────
        var parsedStatuses = new List<RequestStatus>();
        if (!string.IsNullOrWhiteSpace(statuses))
        {
            foreach (var part in statuses.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!Enum.TryParse<RequestStatus>(part, ignoreCase: true, out var s))
                    return BadRequest($"Unknown status value: '{part}'. Valid values: {string.Join(", ", Enum.GetNames<RequestStatus>())}.");
                parsedStatuses.Add(s);
            }
        }

        var query = new SearchRequestsQuery
        {
            RequestNumber  = requestNumber,
            Statuses       = parsedStatuses,
            DateFrom       = dateFrom,
            DateTo         = dateTo,
            RequestType    = requestType,
            SortBy         = sortBy,
            SortDescending = sortDescending,
            Page           = page,
            PageSize       = pageSize,
        };

        var (userId, isAdmin) = ReadUserContext();

        try
        {
            var result = await _service.SearchRequestsAsync(query, userId, isAdmin, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private (int userId, bool isAdmin) ReadUserContext()
    {
        var userId  = ParseUserId(Request.Headers["X-User-Id"].FirstOrDefault());
        var isAdmin = string.Equals(
            Request.Headers["X-Is-Admin"].FirstOrDefault(),
            "true",
            StringComparison.OrdinalIgnoreCase);
        return (userId, isAdmin);
    }

    private static int ParseUserId(string? value)
        => int.TryParse(value, out var id) ? id : 1;
}
