import { useEffect, useRef, useState } from 'react';
import { searchRequests } from '../api/requestsApi';
import type { PagedResult, RequestDto, SearchParams } from '../api/types';

interface UseSearchResult {
  data:    PagedResult<RequestDto> | null;
  loading: boolean;
  error:   string | null;
}

/**
 * Fires a search whenever `params` changes.
 * Cancels in-flight requests via AbortController so stale results are never shown.
 */
export function useSearch(params: SearchParams | null): UseSearchResult {
  const [data,    setData]    = useState<PagedResult<RequestDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!params) return;

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller  = new AbortController();
    abortRef.current  = controller;

    setLoading(true);
    setError(null);

    searchRequests(params, controller.signal)
      .then(result => {
        setData(result);
      })
      .catch(err => {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message ?? 'Unknown error');
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [params]);

  return { data, loading, error };
}
