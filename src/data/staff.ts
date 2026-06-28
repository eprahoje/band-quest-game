// Band Quest — staff e crew (feature 0013, slices 1 e 2).
// Espelho de band-quest-docs/docs/features/staff-and-crew/refinement/iteration-02.md
//
// Staff são PESSOAS com papel, custo de contratação e salário mensal recorrente (D2). O
// efeito é híbrido (D3): modificadores passivos (slice 3, futuro) e desbloqueios — o roadie
// habilita locais maiores (gate escalonado por tier, D4/slice 2). NÚMEROS = placeholders (0003).

export type StaffRole =
  | 'manager'
  | 'vocal-coach'
  | 'roadie'
  | 'sound-tech'
  | 'lighting-tech'
  | 'driver'
  | 'security'
  | 'stage-manager'

export interface StaffRoleDef {
  role: StaffRole
  label: string
  description: string
  hireCost: number // custo único ao contratar
  monthlySalary: number // salário recorrente (cobrado na virada de mês, soma ao custo da banda)
}

// Catálogo de cargos (D1 + D8). Cada cargo é ÚNICO (D7): contratado no máximo uma vez.
// Custos/salários são placeholders de balance (0003).
export const STAFF_ROLES: readonly StaffRoleDef[] = [
  // Negócio/pessoal — modificadores (slice 3, futuro)
  { role: 'manager', label: 'Empresário', description: 'Negocia melhores cachês (futuro: +% no cachê).', hireCost: 1000, monthlySalary: 400 },
  { role: 'vocal-coach', label: 'Preparador vocal', description: 'Poupa a banda nos shows (futuro: −fadiga).', hireCost: 800, monthlySalary: 300 },
  // Crew/produção — habilitam locais maiores (gate por conjunto de cargos, D9)
  { role: 'roadie', label: 'Roadie', description: 'Monta e carrega o equipamento — base de qualquer produção.', hireCost: 500, monthlySalary: 200 },
  { role: 'sound-tech', label: 'Técnico de som', description: 'Mixa o palco — exigido em locais médios/grandes.', hireCost: 700, monthlySalary: 250 },
  { role: 'lighting-tech', label: 'Iluminador', description: 'Operação de luz — exigida em locais médios/grandes.', hireCost: 700, monthlySalary: 250 },
  { role: 'driver', label: 'Motorista', description: 'Leva a banda à estrada (futuro: turnês maiores).', hireCost: 600, monthlySalary: 250 },
  { role: 'security', label: 'Segurança', description: 'Controla grandes públicos — exigido em estádios/festivais.', hireCost: 600, monthlySalary: 220 },
  { role: 'stage-manager', label: 'Produtor de palco', description: 'Coordena a produção dos grandes shows.', hireCost: 900, monthlySalary: 350 },
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
  const counts = Object.fromEntries(STAFF_ROLES.map((r) => [r.role, 0])) as Record<StaffRole, number>
  for (const m of hired) counts[m.role]++
  return counts
}

// A banda já tem este cargo? (cargos são únicos — D7)
export function hasStaffRole(hired: readonly StaffMember[], role: StaffRole): boolean {
  return hired.some((m) => m.role === role)
}
