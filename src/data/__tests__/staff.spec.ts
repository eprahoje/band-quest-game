import { describe, it, expect } from 'vitest'
import { STAFF_ROLES, getStaffRole, staffCountsByRole, type StaffMember } from '@/data/staff'

describe('staff (feature 0013, slice 1)', () => {
  it('has the four initial roles (D1)', () => {
    const roles = STAFF_ROLES.map((r) => r.role).sort()
    expect(roles).toEqual(['driver', 'manager', 'roadie', 'vocal-coach'])
  })

  it('each role has a hire cost and a monthly salary (D2)', () => {
    for (const r of STAFF_ROLES) {
      expect(r.hireCost).toBeGreaterThan(0)
      expect(r.monthlySalary).toBeGreaterThan(0)
    }
  })

  it('getStaffRole resolves a role and throws on unknown', () => {
    expect(getStaffRole('roadie').label).toBe('Roadie')
    // @ts-expect-error papel inválido
    expect(() => getStaffRole('bouncer')).toThrow('Unknown staff role')
  })

  it('counts hired members by role', () => {
    const hired: StaffMember[] = [
      { id: '1', role: 'roadie' },
      { id: '2', role: 'roadie' },
      { id: '3', role: 'driver' },
    ]
    const counts = staffCountsByRole(hired)
    expect(counts.roadie).toBe(2)
    expect(counts.driver).toBe(1)
    expect(counts.manager).toBe(0)
  })
})
