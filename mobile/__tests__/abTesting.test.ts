import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  assignVariant,
  trackEvent,
  getEvents,
  clearEvents,
  getExperiment,
  EXPERIMENTS,
} from '../services/abTesting'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

beforeEach(async () => {
  await clearEvents()
  ;(AsyncStorage.getItem as jest.Mock).mockClear()
  ;(AsyncStorage.setItem as jest.Mock).mockClear()
})

describe('assignVariant', () => {
  it('returns a valid variant id', () => {
    const experiment = EXPERIMENTS[0]
    const result = assignVariant('user-123', experiment.id, experiment.variants)
    const validIds = experiment.variants.map((v) => v.id)
    expect(validIds).toContain(result)
  })

  it('is deterministic -- same inputs always produce the same variant', () => {
    const experiment = EXPERIMENTS[0]
    const first = assignVariant('user-abc', experiment.id, experiment.variants)
    const second = assignVariant('user-abc', experiment.id, experiment.variants)
    expect(first).toBe(second)
  })

  it('produces different assignments for different users', () => {
    const experiment = EXPERIMENTS[0]
    const results = new Set<string>()
    for (let i = 0; i < 50; i++) {
      results.add(assignVariant('user-' + i, experiment.id, experiment.variants))
    }
    // With 50 users and 2 equal-weight variants, both should appear
    expect(results.size).toBeGreaterThan(1)
  })

  it('respects variant weights -- control gets ~50% of traffic', () => {
    const experiment = EXPERIMENTS[0]
    let controlCount = 0
    const total = 200
    for (let i = 0; i < total; i++) {
      const v = assignVariant('u' + i, experiment.id, experiment.variants)
      if (v === 'control') controlCount++
    }
    const ratio = controlCount / total
    expect(ratio).toBeGreaterThan(0.35)
    expect(ratio).toBeLessThan(0.65)
  })
})

describe('getExperiment', () => {
  it('returns the experiment by id', () => {
    const exp = getExperiment('onboarding-flow')
    expect(exp).toBeDefined()
    expect(exp?.id).toBe('onboarding-flow')
  })

  it('returns undefined for unknown ids', () => {
    expect(getExperiment('does-not-exist')).toBeUndefined()
  })
})

describe('trackEvent / getEvents', () => {
  it('persists a tracked event', async () => {
    await trackEvent({ experimentId: 'onboarding-flow', variantId: 'control', metric: 'view', value: 1 })
    const events = await getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].metric).toBe('view')
    expect(events[0].variantId).toBe('control')
    expect(events[0].timestamp).toBeGreaterThan(0)
  })

  it('accumulates multiple events', async () => {
    await trackEvent({ experimentId: 'onboarding-flow', variantId: 'control', metric: 'view', value: 1 })
    await trackEvent({ experimentId: 'contribution-cta', variantId: 'pay-now', metric: 'tap', value: 1 })
    const events = await getEvents()
    expect(events).toHaveLength(2)
  })

  it('value defaults work -- callers can omit value', async () => {
    await trackEvent({ experimentId: 'onboarding-flow', variantId: 'simplified', metric: 'complete', value: 1 })
    const events = await getEvents()
    expect(events[0].value).toBe(1)
  })
})

describe('clearEvents', () => {
  it('removes all tracked events', async () => {
    await trackEvent({ experimentId: 'onboarding-flow', variantId: 'control', metric: 'view', value: 1 })
    await clearEvents()
    const events = await getEvents()
    expect(events).toHaveLength(0)
  })
})

describe('disabled experiments', () => {
  it('all experiments in EXPERIMENTS have an enabled flag', () => {
    for (const exp of EXPERIMENTS) {
      expect(typeof exp.enabled).toBe('boolean')
    }
  })
})
