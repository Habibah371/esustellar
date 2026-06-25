import type { LeaderboardEntry, LeaderboardFilter, LeaderboardPeriod } from './leaderboardTypes';

const mockEntries: LeaderboardEntry[] = [
  { userId: 'u1', userName: 'Alice', avatar: 'alice.png', savingsAmount: 2500, rank: 1, groupId: 'g1', period: 'weekly' },
  { userId: 'u2', userName: 'Bob', avatar: 'bob.png', savingsAmount: 2100, rank: 2, groupId: 'g1', period: 'weekly' },
  { userId: 'u3', userName: 'Charlie', avatar: 'charlie.png', savingsAmount: 1800, rank: 3, groupId: 'g1', period: 'weekly' },
  { userId: 'u4', userName: 'Diana', avatar: 'diana.png', savingsAmount: 1500, rank: 4, groupId: 'g2', period: 'weekly' },
  { userId: 'u5', userName: 'Eve', avatar: 'eve.png', savingsAmount: 1200, rank: 5, groupId: 'g2', period: 'weekly' },
  { userId: 'u1', userName: 'Alice', avatar: 'alice.png', savingsAmount: 9800, rank: 1, groupId: 'g1', period: 'monthly' },
  { userId: 'u2', userName: 'Bob', avatar: 'bob.png', savingsAmount: 8200, rank: 2, groupId: 'g1', period: 'monthly' },
  { userId: 'u3', userName: 'Charlie', avatar: 'charlie.png', savingsAmount: 7600, rank: 3, groupId: 'g1', period: 'monthly' },
  { userId: 'u4', userName: 'Diana', avatar: 'diana.png', savingsAmount: 6100, rank: 4, groupId: 'g2', period: 'monthly' },
  { userId: 'u5', userName: 'Eve', avatar: 'eve.png', savingsAmount: 5400, rank: 5, groupId: 'g2', period: 'monthly' },
  { userId: 'u1', userName: 'Alice', avatar: 'alice.png', savingsAmount: 45000, rank: 1, groupId: 'g1', period: 'allTime' },
  { userId: 'u2', userName: 'Bob', avatar: 'bob.png', savingsAmount: 38200, rank: 2, groupId: 'g1', period: 'allTime' },
  { userId: 'u3', userName: 'Charlie', avatar: 'charlie.png', savingsAmount: 29900, rank: 3, groupId: 'g1', period: 'allTime' },
  { userId: 'u4', userName: 'Diana', avatar: 'diana.png', savingsAmount: 21500, rank: 4, groupId: 'g2', period: 'allTime' },
  { userId: 'u5', userName: 'Eve', avatar: 'eve.png', savingsAmount: 18200, rank: 5, groupId: 'g2', period: 'allTime' },
];

function filterEntries(filter: LeaderboardFilter, period: LeaderboardPeriod): LeaderboardEntry[] {
  let entries = mockEntries.filter((e) => e.period === period);
  if (filter.groupId) {
    entries = entries.filter((e) => e.groupId === filter.groupId);
  }
  entries = entries.sort((a, b) => a.rank - b.rank);
  if (filter.limit) {
    entries = entries.slice(0, filter.limit);
  }
  return entries;
}

export async function getLeaderboard(
  filter: LeaderboardFilter = {},
  period: LeaderboardPeriod = 'weekly',
): Promise<LeaderboardEntry[]> {
  await new Promise((r) => setTimeout(r, 150));
  return filterEntries(filter, period);
}

export async function getUserRank(
  userId: string,
  period: LeaderboardPeriod = 'weekly',
): Promise<{ rank: number; entry: LeaderboardEntry | null }> {
  await new Promise((r) => setTimeout(r, 100));
  const entry = mockEntries.find((e) => e.userId === userId && e.period === period) || null;
  return { rank: entry?.rank ?? -1, entry };
}
