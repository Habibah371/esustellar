import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api/notificationsApi';
import { queryKeys } from '../services/queryClient';

export function useUserNotifications(userAddress: string) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.getUserNotifications(userAddress),
    enabled: !!userAddress,
  });
}

export function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    [queryClient],
  );
}
