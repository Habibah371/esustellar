import { create } from 'zustand';
import type { LeaderboardEntry, LeaderboardPeriod } from './leaderboardTypes';
import { getLeaderboard as fetchLeaderboardData } from './leaderboardService';

interface LeaderboardState {
  leaderboardData: LeaderboardEntry[];
  selectedPeriod: LeaderboardPeriod;
  isLoading: boolean;
  fetchLeaderboard: () => Promise<void>;
  setPeriod: (period: LeaderboardPeriod) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  leaderboardData: [],
  selectedPeriod: 'weekly',
  isLoading: false,
  fetchLeaderboard: async () => {
    set({ isLoading: true });
    const { selectedPeriod } = get();
    const data = await fetchLeaderboardData({}, selectedPeriod);
    set({ leaderboardData: data, isLoading: false });
  },
  setPeriod: (period) => set({ selectedPeriod: period }),
}));
