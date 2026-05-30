import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../services/api/groupsApi';
import { queryKeys } from '../services/queryClient';

export function useUserGroups(userAddress: string) {
  return useQuery({
    queryKey: queryKeys.groups.user(userAddress),
    queryFn: () => groupsApi.getUserGroups(userAddress),
    enabled: !!userAddress,
  });
}

export function useGroupById(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => groupsApi.getGroupById(groupId),
    enabled: !!groupId,
  });
}

export function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
    [queryClient],
  );
}
