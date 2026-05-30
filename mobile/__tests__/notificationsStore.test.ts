import { useNotificationsStore } from '../stores/notificationsStore';
import type { Notification } from '../types/notification';

const n1: Notification = { id: '1', title: 'Test', message: 'Hello', read: false, createdAt: '2024-01-01' };
const n2: Notification = { id: '2', title: 'Test 2', message: 'World', read: true, createdAt: '2024-01-02' };

describe('useNotificationsStore', () => {
  beforeEach(() => useNotificationsStore.setState({ notifications: [], unreadCount: 0 }));

  it('sets notifications and computes unreadCount', () => {
    useNotificationsStore.getState().setNotifications([n1, n2]);
    expect(useNotificationsStore.getState().unreadCount).toBe(1);
  });

  it('markRead decrements unreadCount', () => {
    useNotificationsStore.getState().setNotifications([n1, n2]);
    useNotificationsStore.getState().markRead('1');
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
  });

  it('markAllRead resets unreadCount to 0', () => {
    useNotificationsStore.getState().setNotifications([n1, n2]);
    useNotificationsStore.getState().markAllRead();
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    expect(useNotificationsStore.getState().notifications.every((n) => n.read)).toBe(true);
  });
});