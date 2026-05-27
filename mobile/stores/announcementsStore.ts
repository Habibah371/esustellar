import { create } from 'zustand';
import { Announcement } from '../services/announcements';

type AnnouncementsState = {
  announcements: Announcement[];
  dismissed: string[];
  setAnnouncements: (items: Announcement[]) => void;
  dismiss: (id: string) => void;
  visibleAnnouncements: () => Announcement[];
};

export const useAnnouncementsStore = create<AnnouncementsState>((set, get) => ({
  announcements: [],
  dismissed: [],
  setAnnouncements: (items) =>
    set(() => ({ announcements: items })),
  dismiss: (id) =>
    set((state) => ({ dismissed: [...state.dismissed, id] })),
  visibleAnnouncements: () => {
    const { announcements, dismissed } = get();
    return announcements.filter((a) => !dismissed.includes(a.id));
  },
}));
