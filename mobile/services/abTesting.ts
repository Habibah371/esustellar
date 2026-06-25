import AsyncStorage from '@react-native-async-storage/async-storage'

export type Variant = {
  id: string
  weight: number // fraction of traffic; all weights in an experiment must sum to 1
}

export type Experiment = {
  id: string
  name: string
  description: string
  variants: Variant[]
  enabled: boolean
}

export type ExperimentEvent = {
  experimentId: string
  variantId: string
  metric: string
  value: number
  timestamp: number
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'onboarding-flow',
    name: 'Onboarding Flow',
    description: 'Simplified single-screen onboarding vs the original multi-step flow.',
    variants: [
      { id: 'control', weight: 0.5 },
      { id: 'simplified', weight: 0.5 },
    ],
    enabled: true,
  },
  {
    id: 'contribution-cta',
    name: 'Contribution CTA Label',
    description: 'Tests alternative labels on the contribute button.',
    variants: [
      { id: 'control', weight: 0.5 },
      { id: 'pay-now', weight: 0.5 },
    ],
    enabled: true,
  },
]

const EVENTS_STORAGE_KEY = 'esustellar:ab:events'

// Deterministic djb2 hash -- synchronous, no external deps
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
  }
  return Math.abs(hash)
}

// Assigns a variant deterministically: same userId + experimentId always returns the same variant
export function assignVariant(userId: string, experimentId: string, variants: Variant[]): string {
  const bucket = hashString(userId + ':' + experimentId) % 100
  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight * 100
    if (bucket < cumulative) return variant.id
  }
  return variants[variants.length - 1].id
}

export function getExperiment(id: string): Experiment | undefined {
  return EXPERIMENTS.find((e) => e.id === id)
}

export async function trackEvent(event: Omit<ExperimentEvent, 'timestamp'>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_STORAGE_KEY)
    const events: ExperimentEvent[] = raw ? JSON.parse(raw) : []
    events.push({ ...event, timestamp: Date.now() })
    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  } catch {
    // Tracking must never crash the app
  }
}

export async function getEvents(): Promise<ExperimentEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function clearEvents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(EVENTS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
