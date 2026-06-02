export type NotificationType = 'contribution' | 'payout' | 'member' | 'status';

export type NotificationCategory = 'all' | 'payments' | 'members' | 'updates' | 'groups';

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: NotificationType;
  category?: NotificationCategory;
};

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, { label: string; emoji: string; color: string }> = {
  all: { label: 'All', emoji: '📬', color: '#007AFF' },
  payments: { label: 'Payments', emoji: '💸', color: '#34C759' },
  members: { label: 'Members', emoji: '👥', color: '#FF9500' },
  updates: { label: 'Updates', emoji: '📢', color: '#5856D6' },
  groups: { label: 'Groups', emoji: '👨‍👩‍👧‍👦', color: '#FF3B30' },
};