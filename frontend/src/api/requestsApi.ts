import type { PagedResult, RequestDto, SearchParams } from './types';

// Update this port to match what `dotnet run` prints in the console (e.g. "Now listening on: http://localhost:XXXXX")
const BASE_URL = 'http://localhost:60702/api/requests';

// Current user context – set dynamically by the UserSwitcher component
let currentUserId  = 1;
let currentIsAdmin = true;

export function setUserContext(userId: number, isAdmin: boolean) {
  currentUserId  = userId;
  currentIsAdmin = isAdmin;
}

function authHeaders(): HeadersInit {
  return {
    'X-User-Id':  String(currentUserId),
    'X-Is-Admin': String(currentIsAdmin),
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
