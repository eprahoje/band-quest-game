// Band Quest — catálogo de locais de show (feature 0016, slice 1).
// Espelho de band-quest-docs/docs/features/venues-and-shows/refinement/iteration-02.md
//
// MVP com TIERS abstratos (D1): bar → casa de shows → ginásio → estádio/festival. O
// objetivo de longo prazo é HÍBRIDO (tiers dentro de regiões/cidades a partir da origem);
// por isso `Venue` já nasce com `region` (default "Nacional"). Desbloqueio por REPUTAÇÃO
// + FÃS (D2). Capacidade alimenta a bilheteria da slice 2. NÚMEROS = placeholders (0003).

export type VenueTier = 'bar' | 'casa' | 'ginasio' | 'estadio'

export const VENUE_TIER_LABEL: Record<VenueTier, string> = {
  bar: 'Bar',
  casa: 'Casa de shows',
  ginasio: 'Ginásio',
  estadio: 'Estádio / Festival',
}

export interface Venue {
  id: string
  name: string
  tier: VenueTier
  capacity: number // lotação máxima (teto da bilheteria — slice 2)
  region: string // "Nacional" no MVP; base para a geografia híbrida (futuro)
  repThreshold: number // reputação mínima para desbloquear
  minFans: number // público mínimo (fãs) para desbloquear
}

// Catálogo inicial — um local por tier (placeholders de balance, 0003).
export const VENUES: readonly Venue[] = [
  { id: 'bar', name: 'Bar da Esquina', tier: 'bar', capacity: 80, region: 'Nacional', repThreshold: 0, minFans: 0 },
  { id: 'casa', name: 'Casa de Shows Aurora', tier: 'casa', capacity: 400, region: 'Nacional', repThreshold: 15, minFans: 300 },
  { id: 'ginasio', name: 'Ginásio Poliesportivo', tier: 'ginasio', capacity: 2000, region: 'Nacional', repThreshold: 45, minFans: 3000 },
  { id: 'estadio', name: 'Estádio Nacional', tier: 'estadio', capacity: 15000, region: 'Nacional', repThreshold: 85, minFans: 20000 },
]

export interface UnlockStats {
  reputation: number
  fans: number
}

export function isVenueUnlocked(v: Venue, s: UnlockStats): boolean {
  return s.reputation >= v.repThreshold && s.fans >= v.minFans
}

// Requisito que ainda falta para desbloquear (null se já liberado) — para a UI.
export function missingRequirement(v: Venue, s: UnlockStats): string | null {
  if (isVenueUnlocked(v, s)) return null
  const parts: string[] = []
  if (s.reputation < v.repThreshold) parts.push(`${v.repThreshold} de reputação`)
  if (s.fans < v.minFans) parts.push(`${v.minFans} fãs`)
  return parts.join(' · ')
}

export function getVenue(id: string): Venue {
  const v = VENUES.find((x) => x.id === id)
  if (!v) throw new Error(`Unknown venue: ${id}`)
  return v
}
