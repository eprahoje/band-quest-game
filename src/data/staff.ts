// Band Quest — staff e crew (feature 0013, slices 1 e 2).
// Espelho de band-quest-docs/docs/features/staff-and-crew/refinement/iteration-02.md
//
// Staff são PESSOAS com papel, custo de contratação e salário mensal recorrente (D2). O
// efeito é híbrido (D3): modificadores passivos (slice 3, futuro) e desbloqueios — o roadie
// habilita locais maiores (gate escalonado por tier, D4/slice 2). NÚMEROS = placeholders (0003).

export type StaffRole = 'manager' | 'vocal-coach' | 'roadie' | 'driver'

export interface StaffRoleDef {
  role: StaffRole
  label: string
  description: string
  hireCost: number // custo único ao contratar
  monthlySalary: number // salário recorrente (cobrado na virada de mês, soma ao custo da banda)
}

// Conjunto inicial — 4 papéis (D1). Custos/salários são placeholders de balance (0003).
export const STAFF_ROLES: readonly StaffRoleDef[] = [
  { role: 'manager', label: 'Empresário', description: 'Negocia melhores cachês (futuro: +% no cachê).', hireCost: 1000, monthlySalary: 400 },
  { role: 'vocal-coach', label: 'Preparador vocal', description: 'Poupa a banda nos shows (futuro: −fadiga).', hireCost: 800, monthlySalary: 300 },
  { role: 'roadie', label: 'Roadie', description: 'Monta e carrega o equipamento — libera locais maiores.', hireCost: 500, monthlySalary: 200 },
  { role: 'driver', label: 'Motorista', description: 'Leva a banda à estrada (futuro: turnês maiores).', hireCost: 600, monthlySalary: 250 },
]

export function getStaffRole(role: StaffRole): StaffRoleDef {
  const r = STAFF_ROLES.find((x) => x.role === role)
  if (!r) throw new Error(`Unknown staff role: ${role}`)
  return r
}

// Instância contratada (uma pessoa). Múltiplas do mesmo papel são permitidas (ex.: 2 roadies).
export interface StaffMember {
  id: string
  role: StaffRole
}

// Contagem de membros contratados por papel — base para o gate de locais (0016).
export function staffCountsByRole(hired: readonly StaffMember[]): Record<StaffRole, number> {
  const counts: Record<StaffRole, number> = { manager: 0, 'vocal-coach': 0, roadie: 0, driver: 0 }
  for (const m of hired) counts[m.role]++
  return counts
}
