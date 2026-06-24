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
    const action = getAction('play-show')
    const effort = resolveEffort(action)
    const out = resolveOutcome(action, effort, { rng: noVariance, qualityModifier: 1 })
    expect(out).toEqual({ cash: 200, reputation: 3, fans: 40, fatigue: 15 })
  })

  it('scales positive non-fatigue gains by the quality modifier', () => {
    const action = getAction('play-show')
    const out = resolveOutcome(action, resolveEffort(action), {
      rng: noVariance,
      qualityModifier: 1.2,
    })
    expect(out.fans).toBe(48) // 40 * 1.2
    expect(out.fatigue).toBe(15) // fadiga não escala com qualidade
  })

  it('scales negative cash cost by the effort cost modifier', () => {
    const action = getAction('record-single')
    const careful = action.effortOptions.find((e) => e.label === 'Single caprichado')!
    const out = resolveOutcome(action, careful, { rng: noVariance, qualityModifier: 1 })
    expect(out.cash).toBe(-480) // -300 * 1.6
  })

  it('applies variance within the declared bounds', () => {
    const action = getAction('play-show') // variance 0.2
    const low = resolveOutcome(action, resolveEffort(action), { rng: () => 0, qualityModifier: 1 })
    const high = resolveOutcome(action, resolveEffort(action), { rng: () => 1, qualityModifier: 1 })
    expect(low.fans).toBe(32) // 40 * (1 - 0.2)
    expect(high.fans).toBe(48) // 40 * (1 + 0.2)
  })
})
