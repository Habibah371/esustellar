export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

export interface LeaderboardFilter {
  groupId?: string;
  limit?: number;
  offset?: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  savingsAmount: number;
  rank: number;
  groupId: string;
  period: LeaderboardPeriod;
}
