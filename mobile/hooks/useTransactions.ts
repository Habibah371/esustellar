import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../services/api/transactionsApi';
import { queryKeys } from '../services/queryClient';

export function useUserTransactions(userAddress: string) {
  return useQuery({
    queryKey: queryKeys.transactions.all,
    queryFn: () => transactionsApi.getUserTransactions(userAddress),
    enabled: !!userAddress,
  });
}

export function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    [queryClient],
  );
}
