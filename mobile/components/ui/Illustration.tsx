/**
 * Empty State Illustrations
 * Visual assets for empty state components
 */
import React from 'react';
import type { ReactNode } from 'react';
import {
  DefaultIllustration,
  ErrorIllustration,
  GroupsIllustration,
  NotificationsIllustration,
  SearchIllustration,
  SuccessIllustration,
  TransactionsIllustration,
  WalletIllustration,
} from '../../assets/illustrations';

export type IllustrationType = 
  | 'groups' 
  | 'transactions' 
  | 'notifications' 
  | 'search' 
  | 'wallet' 
  | 'error'
  | 'success'
  | 'default';

interface IllustrationConfig {
  description: string;
  render: () => ReactNode;
}

// Map of illustration types to their visual representation
export const illustrations: Record<IllustrationType, IllustrationConfig> = {
  groups: {
    description: 'No groups yet',
    render: () => <GroupsIllustration />,
  },
  transactions: {
    description: 'No transactions yet',
    render: () => <TransactionsIllustration />,
  },
  notifications: {
    description: 'No notifications',
    render: () => <NotificationsIllustration />,
  },
  search: {
    description: 'No results found',
    render: () => <SearchIllustration />,
  },
  wallet: {
    description: 'No wallet connected',
    render: () => <WalletIllustration />,
  },
  error: {
    description: 'Something went wrong',
    render: () => <ErrorIllustration />,
  },
  success: {
    description: 'Success',
    render: () => <SuccessIllustration />,
  },
  default: {
    description: 'Nothing here',
    render: () => <DefaultIllustration />,
  },
};

/**
 * Get illustration config by type
 */
export function getIllustration(type: IllustrationType): IllustrationConfig {
  return illustrations[type] || illustrations.default;
}

/**
 * Get illustration emoji by type
 */
export function getIllustrationEmoji(type: IllustrationType): string {
  const fallbackMap: Record<IllustrationType, string> = {
    groups: '👥',
    transactions: '💳',
    notifications: '🔔',
    search: '🔍',
    wallet: '💼',
    error: '⚠️',
    success: '✅',
    default: '📦',
  };
  return fallbackMap[type];
}
