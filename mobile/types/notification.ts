export type NotificationType = 'contribution' | 'payout' | 'member' | 'status';

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: NotificationType;
};