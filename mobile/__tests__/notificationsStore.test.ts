import { useNotificationsStore } from '../stores/notificationsStore';
import type { Notification } from '../types/notification';

const n1: Notification = { id: '1', title: 'Test', message: 'Hello', read: false, createdAt: '2024-01-01', type: 'contribution', category: 'payments' };
const n2: Notification = { id: '2', title: 'Test 2', message: 'World', read: true, createdAt: '2024-01-02', type: 'member', category: 'members' };
const n3: Notification = { id: '3', title: 'Test 3', message: 'Update', read: false, createdAt: '2024-01-03', type: 'status', category: 'updates' };

describe('useNotificationsStore', () => {
  beforeEach(() => useNotificationsStore.setState({ notifications: [], unreadCount: 0, selectedCategory: 'all' }));

  it('sets notifications and computes unreadCount', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    expect(useNotificationsStore.getState().unreadCount).toBe(2);
  });

  it('markRead decrements unreadCount', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    useNotificationsStore.getState().markRead('1');
    expect(useNotificationsStore.getState().unreadCount).toBe(1);
  });

  it('markAllRead resets unreadCount to 0', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    useNotificationsStore.getState().markAllRead();
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    expect(useNotificationsStore.getState().notifications.every((n) => n.read)).toBe(true);
  });

  it('setSelectedCategory updates the selected category', () => {
    useNotificationsStore.getState().setSelectedCategory('payments');
    expect(useNotificationsStore.getState().selectedCategory).toBe('payments');
  });

  it('getFilteredNotifications returns all notifications when category is "all"', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    useNotificationsStore.getState().setSelectedCategory('all');
    const filtered = useNotificationsStore.getState().getFilteredNotifications();
    expect(filtered).toHaveLength(3);
  });

  it('getFilteredNotifications filters notifications by category', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    useNotificationsStore.getState().setSelectedCategory('payments');
    const filtered = useNotificationsStore.getState().getFilteredNotifications();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('getFilteredNotifications filters by members category', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    useNotificationsStore.getState().setSelectedCategory('members');
    const filtered = useNotificationsStore.getState().getFilteredNotifications();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('2');
  });

  it('getFilteredNotifications filters by updates category', () => {
    useNotificationsStore.getState().setNotifications([n1, n2, n3]);
    useNotificationsStore.getState().setSelectedCategory('updates');
    const filtered = useNotificationsStore.getState().getFilteredNotifications();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('3');
  });
});