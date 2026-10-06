using Requests.Domain.Entities;

namespace Requests.Application.Requests;

public sealed class RequestService : IRequestService
{
    private readonly IRequestRepository _repository;

    public RequestService(IRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<RequestDto>> GetRequestsAsync(
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default)
    {
        var requests = await _repository.GetAllAsync(cancellationToken);

        if (!isAdministrator)
        {
            requests = requests
                .Where(x => x.OwnerId == currentUserId || x.AssignedToUserId == currentUserId)
                .ToList();
        }

        return requests.Select(ToDto).ToList();
    }

    public async Task<PagedResult<RequestDto>> SearchRequestsAsync(
        SearchRequestsQuery query,
        int currentUserId,
        bool isAdministrator,
        CancellationToken cancellationToken = default)
    {
        // Validation: DateFrom must not be after DateTo
        if (query.DateFrom.HasValue && query.DateTo.HasValue &&
            query.DateFrom.Value > query.DateTo.Value)
        {
            throw new ArgumentException("DateFrom cannot be after DateTo.");
        }

        var paged = await _repository.SearchAsync(query, currentUserId, isAdministrator, cancellationToken);

        return new PagedResult<RequestDto>
        {
            Items      = paged.Items.Select(ToDto).ToList(),
            TotalCount = paged.TotalCount,
            Page       = paged.Page,
            PageSize   = paged.PageSize,
        };
    }

    private static RequestDto ToDto(Request x) => new(
        x.Id,
        x.RequestNumber,
        x.CustomerId,
        x.OwnerId,
        x.AssignedToUserId,
        x.Status,
        x.RequestType,
        x.CreatedAt);
}
