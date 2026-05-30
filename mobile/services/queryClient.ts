/**
 * React Query Client Configuration
 * Provides query client for optimistic updates and caching
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  groups: {
    all: ['groups'] as const,
    detail: (id: string) => ['groups', id] as const,
    user: (address: string) => ['groups', 'user', address] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    user: (address: string) => ['transactions', 'user', address] as const,
    group: (groupId: string) => ['transactions', groupId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
};