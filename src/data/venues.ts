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
  capacity: number // lotação máxima (teto da bilheteria)
  region: string // "Nacional" no MVP; base para a geografia híbrida (futuro)
  repThreshold: number // reputação mínima para desbloquear
  minFans: number // público mínimo (fãs) para desbloquear
  baseCachet: number // garantia paga pelo show (escala com reputação no cálculo)
  ticketPrice: number // preço do ingresso (fixo por tier no MVP — D3)
}

// Catálogo inicial — um local por tier (placeholders de balance, 0003).
export const VENUES: readonly Venue[] = [
  { id: 'bar', name: 'Bar da Esquina', tier: 'bar', capacity: 80, region: 'Nacional', repThreshold: 0, minFans: 0, baseCachet: 100, ticketPrice: 10 },
  { id: 'casa', name: 'Casa de Shows Aurora', tier: 'casa', capacity: 400, region: 'Nacional', repThreshold: 15, minFans: 300, baseCachet: 400, ticketPrice: 25 },
  { id: 'ginasio', name: 'Ginásio Poliesportivo', tier: 'ginasio', capacity: 2000, region: 'Nacional', repThreshold: 45, minFans: 3000, baseCachet: 1500, ticketPrice: 50 },
  { id: 'estadio', name: 'Estádio Nacional', tier: 'estadio', capacity: 15000, region: 'Nacional', repThreshold: 85, minFans: 20000, baseCachet: 5000, ticketPrice: 90 },
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

// --- Resultado do show (0016 slice 2 / D3) — receita = cachê + bilheteria. ---
// Placeholders de balance (0003).
const SHOW_BASE_FANS = 30 // novos fãs garantidos por show (bootstrap quando o público é baixo)
const SHOW_FAN_FACTOR = 0.1 // fração do público presente que vira fã
const SHOW_REP_MIN = 1 // reputação ganha por show: faixa aleatória [min, max] (D-Playtest 04 ponto 4)
const SHOW_REP_MAX = 5

export interface ShowContext {
  reputation: number
  fans: number
  reputationCashMultiplier: number // 1 + reputação × fator (reaproveita 0014 it-06)
  rng: () => number
}

export interface ShowResult {
  attendance: number // público presente = min(fãs interessados, capacidade)
  cachet: number // garantia (escala com reputação)
  boxOffice: number // bilheteria = público × preço do ingresso
  cash: number // cachet + boxOffice
  fansGained: number
  reputationGained: number
}

export function computeShowResult(v: Venue, ctx: ShowContext): ShowResult {
  const attendance = Math.min(ctx.fans, v.capacity) // fãs interessados ~ fãs, teto = capacidade
  const cachet = Math.round(v.baseCachet * ctx.reputationCashMultiplier)
  const boxOffice = attendance * v.ticketPrice
  const fansGained = SHOW_BASE_FANS + Math.round(attendance * SHOW_FAN_FACTOR)
  const reputationGained = SHOW_REP_MIN + Math.floor(ctx.rng() * (SHOW_REP_MAX - SHOW_REP_MIN + 1))
  return { attendance, cachet, boxOffice, cash: cachet + boxOffice, fansGained, reputationGained }
}
