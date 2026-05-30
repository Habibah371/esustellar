# Stores

Zustand stores for global state management across the mobile app.

## Pattern

Each store is created with `create<T>()` from `zustand`. Stores that need cross-session
persistence use the `persist` middleware backed by `AsyncStorage`. All stores are
re-exported from `index.ts` so components import from a single path:
`import { useWalletStore } from '@/stores'`.

## Available Stores

| Export | File | Purpose |
|---|---|---|
| `useWalletStore` | `walletStore.ts` | Wallet address and connection state |
| `useGroupsStore` | `groupsStore.ts` | Cached groups list with loading state |
| `useUserStore` | `userStore.ts` | Authenticated user profile |
| `useGroupStore` | `useGroupStore.ts` | Active group context |
