import { describe, it, expect } from 'vitest'
import { VENUES, isVenueUnlocked, missingRequirement, getVenue } from '@/data/venues'

describe('venues (feature 0016, slice 1)', () => {
  it('the starting bar is unlocked at zero reputation and zero fans', () => {
    const bar = getVenue('bar')
    expect(isVenueUnlocked(bar, { reputation: 0, fans: 0 })).toBe(true)
    expect(missingRequirement(bar, { reputation: 0, fans: 0 })).toBeNull()
  })

  it('requires BOTH reputation and fans to unlock a bigger venue (D2)', () => {
    const casa = getVenue('casa') // rep 15, fans 300
    expect(isVenueUnlocked(casa, { reputation: 15, fans: 299 })).toBe(false) // fãs de menos
    expect(isVenueUnlocked(casa, { reputation: 14, fans: 300 })).toBe(false) // rep de menos
    expect(isVenueUnlocked(casa, { reputation: 15, fans: 300 })).toBe(true)
  })

  it('reports the missing requirement (only the parts still lacking)', () => {
    const ginasio = getVenue('ginasio') // rep 45, fans 3000
    expect(missingRequirement(ginasio, { reputation: 0, fans: 0 })).toBe('45 de reputação · 3000 fãs')
    expect(missingRequirement(ginasio, { reputation: 50, fans: 0 })).toBe('3000 fãs')
    expect(missingRequirement(ginasio, { reputation: 50, fans: 3000 })).toBeNull()
  })

  it('catalog tiers escalate in capacity', () => {
    const caps = VENUES.map((v) => v.capacity)
    const sorted = [...caps].sort((a, b) => a - b)
    expect(caps).toEqual(sorted) // já está em ordem crescente de porte
  })
})
