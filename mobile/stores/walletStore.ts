import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WalletState {
  address: string | null;
  isConnecting: boolean;
  connect: (address: string) => void;
  disconnect: () => void;
  setConnecting: (v: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnecting: false,
      connect: (address) => set({ address, isConnecting: false }),
      disconnect: () => set({ address: null, isConnecting: false }),
      setConnecting: (v) => set({ isConnecting: v }),
    }),
    {
      name: 'esustellar-wallet',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ address: state.address }),
    },
  ),
);
