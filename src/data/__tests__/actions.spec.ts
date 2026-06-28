import { describe, it, expect } from 'vitest'
import {
  ACTIONS,
  getAction,
  resolveEffort,
  resolveOutcome,
  type ActionCategory,
} from '@/data/actions'

const VALID_CATEGORIES: ActionCategory[] = [
  'show',
  'recording',
  'tour',
  'marketing',
  'practice',
  'rest',
]

// rng fixo em 0.5 ⇒ fator de variância 1 (determinístico).
const noVariance = () => 0.5

describe('actions catalog', () => {
  it('has unique ids and at least one effort option each', () => {
    const ids = ACTIONS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of ACTIONS) {
      expect(a.effortOptions.length).toBeGreaterThan(0)
    }
  })

  it('uses only valid categories and positive durations/costs', () => {
    for (const a of ACTIONS) {
      expect(VALID_CATEGORIES).toContain(a.category)
      for (const e of a.effortOptions) {
        expect(e.durationTurns).toBeGreaterThan(0)
        expect(e.costModifier).toBeGreaterThan(0)
      }
    }
  })

  it('getAction throws on unknown id', () => {
    expect(() => getAction('does-not-exist')).toThrow('Unknown action')
  })

  it('resolveEffort falls back to the first option for an invalid label', () => {
    const action = getAction('record-single')
    expect(resolveEffort(action, 'inexistente')).toEqual(action.effortOptions[0])
    expect(resolveEffort(action, 'Single caprichado').label).toBe('Single caprichado')
  })
})

describe('resolveOutcome', () => {
  it('returns base deltas with no variance and neutral quality', () => {
    const action = getAction('tour')
    const effort = resolveEffort(action) // Mini-turnê (outcomeModifier 1)
    const out = resolveOutcome(action, effort, { rng: noVariance, qualityModifier: 1 })
    // A fadiga não vive mais nos deltas (0014 it-04: é taxa por dia).
    expect(out).toEqual({ cash: 1800, reputation: 5, fans: 500 })
  })

  it('scales positive gains by the quality modifier', () => {
    const action = getAction('tour')
    const out = resolveOutcome(action, resolveEffort(action), {
      rng: noVariance,
      qualityModifier: 1.2,
    })
    expect(out.fans).toBe(600) // 500 * 1.2
  })

  it('scales positive cash by reputation when the action opts in (0014 it-06)', () => {
    const action = getAction('tour') // cashScalesWithReputation: true
    const out = resolveOutcome(action, resolveEffort(action), {
      rng: noVariance,
      qualityModifier: 1,
      reputationCashMultiplier: 1.5,
    })
    expect(out.cash).toBe(2700) // 1800 * 1.5
  })

  it('scales positive gains by the effort outcome modifier (caprichado)', () => {
    const action = getAction('record-single')
    const careful = action.effortOptions.find((e) => e.label === 'Single caprichado')!
    const out = resolveOutcome(action, careful, { rng: noVariance, qualityModifier: 1 })
    expect(out.fans).toBe(204) // 120 * 1.7
    expect(out.cash).toBe(-640) // -400 * 1.6 (custo escala pelo costModifier)
  })

  it('does not apply variance to costs — custos previsíveis (Playtest 06 ponto 3)', () => {
    const mkt = getAction('marketing') // cash -300, variance 0.2
    const low = resolveOutcome(mkt, resolveEffort(mkt), { rng: () => 0 })
    const high = resolveOutcome(mkt, resolveEffort(mkt), { rng: () => 1 })
    expect(low.cash).toBe(-300) // sem variância no custo, mesmo no extremo do rng
    expect(high.cash).toBe(-300)
  })

  it('applies variance within the declared bounds', () => {
    const action = getAction('tour') // variance 0.25
    const low = resolveOutcome(action, resolveEffort(action), { rng: () => 0, qualityModifier: 1 })
    const high = resolveOutcome(action, resolveEffort(action), { rng: () => 1, qualityModifier: 1 })
    expect(low.fans).toBe(375) // 500 * (1 - 0.25)
    expect(high.fans).toBe(625) // 500 * (1 + 0.25)
  })
})
