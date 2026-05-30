import { useCallback, useRef, useState } from 'react';

/**
 * Hook that manages pull-to-refresh state.
 * Pass the returned `refreshing` and `onRefresh` to a ScrollView/FlatList RefreshControl.
 *
 * @param fetchFn - async function to call on refresh
 */
export function useRefresh(fetchFn: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const onRefresh = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setRefreshing(true);
    const refreshPromise = (async () => {
      try {
        await fetchFn();
      } finally {
        refreshPromiseRef.current = null;
        setRefreshing(false);
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [fetchFn]);

  return { refreshing, onRefresh };
}
