import { useCallback } from 'react'
import { useABTestingStore } from '../stores/abTestingStore'
import { trackEvent } from '../services/abTesting'

type UseExperimentResult = {
  variant: string | null
  isVariant: (variantId: string) => boolean
  track: (metric: string, value?: number) => Promise<void>
}

export function useExperiment(experimentId: string): UseExperimentResult {
  const getVariant = useABTestingStore((s) => s.getVariant)
  const variant = getVariant(experimentId)

  const isVariant = useCallback(
    (variantId: string) => variant === variantId,
    [variant],
  )

  const track = useCallback(
    async (metric: string, value: number = 1) => {
      await trackEvent({ experimentId, variantId: variant, metric, value })
    },
    [experimentId, variant],
  )

  return { variant, isVariant, track }
}
