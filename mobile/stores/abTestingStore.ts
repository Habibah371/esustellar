import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { assignVariant, EXPERIMENTS } from '../services/abTesting'

type AssignedVariants = Record<string, string> // experimentId -> variantId

type ABTestingState = {
  userId: string
  assignedVariants: AssignedVariants
  setUserId: (id: string) => void
  getVariant: (experimentId: string) => string | null
  resolveAllVariants: () => void
  resetVariants: () => void
}

export const useABTestingStore = create<ABTestingState>()(
  persist(
    (set, get) => ({
      userId: '',
      assignedVariants: {},

      setUserId: (id: string) => {
        set({ userId: id })
        get().resolveAllVariants()
      },

      getVariant: (experimentId: string): string | null => {
        const experiment = EXPERIMENTS.find((e) => e.id === experimentId)
        const { userId, assignedVariants } = get()
        if (assignedVariants[experimentId]) return assignedVariants[experimentId]
        // Assign on first access and cache it
        const variant = assignVariant(userId, experimentId, experiment.variants)
        set((state) => ({
          assignedVariants: { ...state.assignedVariants, [experimentId]: variant },
        }))
        return variant
      },

      resolveAllVariants: () => {
        const { userId } = get()
        const resolved: AssignedVariants = {}
        for (const experiment of EXPERIMENTS) {
          if (experiment.enabled) {
            resolved[experiment.id] = assignVariant(userId, experiment.id, experiment.variants)
          }
        }
        set({ assignedVariants: resolved })
      },

      resetVariants: () => set({ assignedVariants: {}, userId: '' }),
    }),
    {
      name: 'esustellar-ab-testing',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
