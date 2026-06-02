import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification, NotificationCategory } from '../types/notification';

type NotificationsState = {
  notifications: Notification[];
  unreadCount: number;
  selectedCategory: NotificationCategory;

  setNotifications: (items: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setSelectedCategory: (category: NotificationCategory) => void;
  getFilteredNotifications: () => Notification[];
};

const getNotificationCategory = (notification: Notification): NotificationCategory => {
  if (!notification.type && !notification.category) return 'updates';
  
  const category = notification.category;
  if (category && category !== 'all') return category;

  // Map type to category if category not explicitly set
  switch (notification.type) {
    case 'payout':
      return 'payments';
    case 'contribution':
      return 'payments';
    case 'member':
      return 'members';
    case 'status':
      return 'updates';
    default:
      return 'updates';
  }
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      selectedCategory: 'all',

      setNotifications: (items) =>
        set(() => ({
          notifications: items,
          unreadCount: items.filter((n) => !n.read).length,
        })),

      markRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          );
          return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      setSelectedCategory: (category) =>
        set(() => ({
          selectedCategory: category,
        })),

      getFilteredNotifications: () => {
        const state = get();
        const { notifications, selectedCategory } = state;

        if (selectedCategory === 'all') {
          return notifications;
        }

        return notifications.filter(
          (notification) => getNotificationCategory(notification) === selectedCategory,
        );
      },
    }),
    {
      name: 'esustellar-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        notifications: state.notifications,
        selectedCategory: state.selectedCategory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.unreadCount = state.notifications.filter((n) => !n.read).length;
        }
      },
    },
  ),
);