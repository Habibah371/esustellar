import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook that manages pull-to-refresh state.
 * Pass the returned `refreshing` and `onRefresh` to a ScrollView/FlatList RefreshControl.
 *
 * PERFORMANCE NOTE: The fetchFn is stored in a ref so changes to it don't
 * invalidate the onRefresh callback.  This keeps components that pass unstable
 * function references (common with useMemo) from forcing re-renders deeper down.
 *
 * @param fetchFn - async function to call on refresh
 */
export function useRefresh(fetchFn: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const fetchFnRef = useRef(fetchFn);

  // Keep the ref current without triggering the useCallback below.
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const onRefresh = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setRefreshing(true);
    const refreshPromise = (async () => {
      try {
        await fetchFnRef.current();
      } finally {
        refreshPromiseRef.current = null;
        setRefreshing(false);
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, []); // stable — no deps

  return { refreshing, onRefresh };
}
