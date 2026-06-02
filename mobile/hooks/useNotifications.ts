import { useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userAddress: string) => notificationsApi.markAllNotificationsRead(userAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
