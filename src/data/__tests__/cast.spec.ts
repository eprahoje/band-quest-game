import { describe, it, expect } from 'vitest'
import {
  CAST,
  validateRoster,
  createDefaultRoster,
  createMember,
  getCharacter,
  type MemberRole,
} from '@/data/cast'

describe('cast data', () => {
  it('has 15 characters, 3 per role', () => {
    expect(CAST).toHaveLength(15)
    const roles: MemberRole[] = ['vocal', 'guitar', 'bass', 'drums', 'keys']
    for (const r of roles) {
      expect(CAST.filter((c) => c.role === r)).toHaveLength(3)
    }
  })

  it('has unique ids and consistent icon names', () => {
    const ids = CAST.map((c) => c.id)
    expect(new Set(ids).size).toBe(15)
    for (const c of CAST) expect(c.icon).toBe(`member-${c.id}.svg`)
  })

  it('keeps every attribute within 0..100', () => {
    for (const c of CAST) {
      for (const v of Object.values(c.attributes)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('validateRoster', () => {
  const m = (id: string) => createMember(getCharacter(id))

  it('accepts the default lineup', () => {
    expect(validateRoster(createDefaultRoster()).valid).toBe(true)
  })

  it('rejects fewer than 3 members', () => {
    expect(validateRoster([m('rita-camargo'), m('tuca-andrade')]).valid).toBe(false)
  })

  it('allows an all-instrumental band (no vocalist) with a drummer', () => {
    const r = validateRoster([m('rita-camargo'), m('nara-siqueira'), m('tuca-andrade')])
    expect(r.valid).toBe(true)
  })

  it('requires a drummer', () => {
    const r = validateRoster([m('rita-camargo'), m('nara-siqueira'), m('iuri-mendes')])
    expect(r.valid).toBe(false)
  })

  it('rejects more than one vocalist', () => {
    const r = validateRoster([
      m('lila-tavares'),
      m('jucara-bonfim'),
      m('rita-camargo'),
      m('nara-siqueira'),
      m('tuca-andrade'),
    ])
    expect(r.valid).toBe(false)
  })
})
