import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  displayName: string;
  theme: 'dark' | 'light' | 'system';
  avatarUri: string | null;
  setDisplayName: (name: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setAvatarUri: (uri: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      displayName: '',
      theme: 'system',
      avatarUri: null,
      setDisplayName: (name) => set({ displayName: name }),
      setTheme: (theme) => set({ theme }),
      setAvatarUri: (uri) => set({ avatarUri: uri }),
      clearUser: () => set({ displayName: '', theme: 'system', avatarUri: null }),
    }),
    {
      name: 'esustellar-user',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);