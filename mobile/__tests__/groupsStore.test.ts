import { useGroupsStore } from '@/stores/groupsStore';

beforeEach(() => {
  useGroupsStore.setState({ groups: [], isLoading: false, lastFetched: null });
});

describe('groupsStore', () => {
  it('setGroups stores groups and records lastFetched', () => {
    const groups = [{ id: '1', name: 'Alpha' }] as any[];
    useGroupsStore.getState().setGroups(groups);
    expect(useGroupsStore.getState().groups).toHaveLength(1);
    expect(useGroupsStore.getState().lastFetched).not.toBeNull();
  });

  it('setLoading toggles the isLoading flag', () => {
    useGroupsStore.getState().setLoading(true);
    expect(useGroupsStore.getState().isLoading).toBe(true);
    useGroupsStore.getState().setLoading(false);
    expect(useGroupsStore.getState().isLoading).toBe(false);
  });

  it('reset clears all state to initial values', () => {
    useGroupsStore.getState().setGroups([{ id: '2', name: 'Beta' }] as any[]);
    useGroupsStore.getState().reset();
    expect(useGroupsStore.getState().groups).toHaveLength(0);
    expect(useGroupsStore.getState().isLoading).toBe(false);
    expect(useGroupsStore.getState().lastFetched).toBeNull();
  });
});
