import { describe, it, expect } from 'vitest'
import { computeScore, computeStars, TIMED_DURATIONS } from '@/data/session'

describe('session score & stars', () => {
  it('combines reputation, fans and cash (cash floored at 0)', () => {
    expect(computeScore({ reputation: 100, fans: 10_000, cash: 5_000 })).toBe(250) // 100 + 100 + 50
    expect(computeScore({ reputation: 0, fans: 0, cash: -9999 })).toBe(0) // dívida não pontua
  })

  it('maps score to 1–5 stars for a 10-year session', () => {
    expect(computeStars(50, 10)).toBe(1)
    expect(computeStars(120, 10)).toBe(2)
    expect(computeStars(250, 10)).toBe(3)
    expect(computeStars(400, 10)).toBe(4)
    expect(computeStars(600, 10)).toBe(5)
  })

  it('scales the thresholds with the session duration', () => {
    // numa sessão de 20 anos, o mesmo score vale menos estrelas
    expect(computeStars(600, 10)).toBe(5)
    expect(computeStars(600, 20)).toBe(3) // 600 >= 250*2=500 (3★), < 400*2=800 (4★)
  })

  it('exposes the timed durations', () => {
    expect(TIMED_DURATIONS).toEqual([10, 20, 30])
  })
})
