import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Announcement } from '../services/announcements';

type AnnouncementsState = {
  announcements: Announcement[];
  dismissed: string[];
  setAnnouncements: (items: Announcement[]) => void;
  dismiss: (id: string) => void;
  visibleAnnouncements: () => Announcement[];
};

export const useAnnouncementsStore = create<AnnouncementsState>()(
  persist(
    (set, get) => ({
      announcements: [],
      dismissed: [],
      setAnnouncements: (items) => set(() => ({ announcements: items })),
      dismiss: (id) =>
        set((state) =>
          state.dismissed.includes(id)
            ? state
            : { dismissed: [...state.dismissed, id] },
        ),
      visibleAnnouncements: () => {
        const { announcements, dismissed } = get();
        return announcements.filter((announcement) => !dismissed.includes(announcement.id));
      },
    }),
    {
      name: 'esustellar-announcements',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ dismissed: state.dismissed }),
    },
  ),
);
