using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public sealed class SearchRequestsQuery
{
    /// <summary>Partial match on RequestNumber (case-insensitive).</summary>
    public string? RequestNumber { get; init; }

    /// <summary>Filter by one or more statuses. Empty = all statuses.</summary>
    public IReadOnlyList<RequestStatus> Statuses { get; init; } = [];

    /// <summary>Inclusive lower bound on CreatedAt (UTC).</summary>
    public DateTime? DateFrom { get; init; }

    /// <summary>Inclusive upper bound on CreatedAt (UTC).</summary>
    public DateTime? DateTo { get; init; }

    /// <summary>Filter by request type. Null = all types.</summary>
    public RequestType? RequestType { get; init; }

    /// <summary>Field to sort by. Defaults to CreatedAt.</summary>
    public SortField SortBy { get; init; } = SortField.CreatedAt;

    /// <summary>Sort direction. Defaults to descending (newest first).</summary>
    public bool SortDescending { get; init; } = true;

    /// <summary>1-based page number.</summary>
    public int Page { get; init; } = 1;

    /// <summary>Page size. Max 100.</summary>
    public int PageSize { get; init; } = 20;
}

public enum SortField
{
    CreatedAt,
    RequestNumber,
    Status,
    RequestType
}
