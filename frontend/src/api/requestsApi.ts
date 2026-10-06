import type { PagedResult, RequestDto, SearchParams } from './types';

// Update this port to match what `dotnet run` prints in the console (e.g. "Now listening on: http://localhost:XXXXX")
const BASE_URL = 'http://localhost:60702/api/requests';

// In the exercise auth is passed via headers.
// These values simulate the currently logged-in user.
// Change X_IS_ADMIN to 'false' and X_USER_ID to e.g. '1' to test regular-user filtering.
const X_USER_ID  = '1';
const X_IS_ADMIN = 'true';

function authHeaders(): HeadersInit {
  return {
    'X-User-Id':  X_USER_ID,
    'X-Is-Admin': X_IS_ADMIN,
  };
}

export async function searchRequests(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<PagedResult<RequestDto>> {
  const qs = new URLSearchParams();

  if (params.requestNumber.trim())
    qs.set('requestNumber', params.requestNumber.trim());

  if (params.statuses.length > 0)
    qs.set('statuses', params.statuses.join(','));

  if (params.dateFrom)
    qs.set('dateFrom', params.dateFrom);

  if (params.dateTo)
    qs.set('dateTo', params.dateTo);

  if (params.requestType)
    qs.set('requestType', params.requestType);

  qs.set('sortBy',         params.sortBy);
  qs.set('sortDescending', String(params.sortDescending));
  qs.set('page',           String(params.page));
  qs.set('pageSize',       String(params.pageSize));

  const res = await fetch(`${BASE_URL}/search?${qs.toString()}`, {
    headers: authHeaders(),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Server error ${res.status}`);
  }

  return res.json() as Promise<PagedResult<RequestDto>>;
}
