import { useUserStore } from '../stores/userStore';

describe('useUserStore', () => {
  beforeEach(() =>
    useUserStore.setState({ displayName: '', theme: 'system', avatarUri: null }),
  );

  it('sets display name', () => {
    useUserStore.getState().setDisplayName('Alice');
    expect(useUserStore.getState().displayName).toBe('Alice');
  });

  it('sets theme', () => {
    useUserStore.getState().setTheme('dark');
    expect(useUserStore.getState().theme).toBe('dark');
  });

  it('sets avatarUri', () => {
    useUserStore.getState().setAvatarUri('file://avatar.png');
    expect(useUserStore.getState().avatarUri).toBe('file://avatar.png');
  });

  it('clearUser resets all fields', () => {
    useUserStore.getState().setDisplayName('Bob');
    useUserStore.getState().setTheme('light');
    useUserStore.getState().clearUser();
    expect(useUserStore.getState().displayName).toBe('');
    expect(useUserStore.getState().theme).toBe('system');
    expect(useUserStore.getState().avatarUri).toBeNull();
  });
});