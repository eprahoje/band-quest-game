// Band Quest — modelo de lançamento, regras de composição e royalties (feature 0015,
// slices 3 e 4).
// Espelho de band-quest-docs/docs/features/songwriting-and-releases/refinement/iteration-01.md (D3/D4)
//
// Cadeia composição → Demo / Single / Álbum. Um lançamento (Release) referencia as
// músicas que o compõem (trackIds) e gera royalties decrescentes por turno (D4), a
// receita de longo prazo que alimenta a aba de Ganhos. NÚMEROS = placeholders (0003).

import type { Song } from './songs'

export type ReleaseType = 'demo' | 'single' | 'album'

export interface Release {
  id: string
  type: ReleaseType
  title: string
  releaseTurn: number
  trackIds: string[] // músicas que compõem o lançamento
  quality: number // média da qualidade das faixas (0–100)
  // Single absorvido por um álbum (não fica disponível p/ outro álbum). Mantido p/ histórico.
  consumedByAlbumId?: string
  // Royalties (slice 4 / D4): receita decrescente por turno.
  fanBaseAtRelease: number // fãs no momento do lançamento (insumo do royalty inicial)
  currentRoyalty: number // royalty pago no PRÓXIMO turno; decai geometricamente até expirar
  totalRoyaltiesEarned: number // acumulado pago por este lançamento (para a aba de Ganhos)
}

// Regras de composição (D3). NÚMEROS = placeholders de balance (0003).
// demo: N músicas; single: 1 música; álbum: X singles já lançados + Y músicas novas.
export const RELEASE_RULES: Record<ReleaseType, { songs?: number; singles?: number }> = {
  demo: { songs: 3 },
  single: { songs: 1 },
  album: { singles: 2, songs: 4 },
}

// --- Royalties (slice 4 / D4) — TODOS placeholders de balance (0003) --------------
//
// Royalty inicial ∝ qualidade × base de fãs, escalado por tipo. Decai geometricamente
// por turno (dia) até cair abaixo do piso, quando expira (para de render). A demo é um
// degrau de carreira: não gera royalty (multiplier 0). Single tem cauda curta-média;
// álbum, cauda mais longa.
export interface RoyaltyProfile {
  multiplier: number // escala do royalty inicial por tipo
  decay: number // fator geométrico por turno (0..1)
}

export const ROYALTY_PROFILE: Record<ReleaseType, RoyaltyProfile> = {
  demo: { multiplier: 0, decay: 0.9 },
  single: { multiplier: 0.6, decay: 0.96 },
  album: { multiplier: 1.0, decay: 0.985 },
}

// Royalty inicial = (qualidade/100) × (fãs × peso + base) × multiplicador do tipo.
export const ROYALTY_FAN_WEIGHT = 0.05
export const ROYALTY_BASE = 20
// Abaixo deste valor por turno, o royalty expira (zera).
export const ROYALTY_FLOOR = 1

export function initialRoyalty(quality: number, fanBase: number, type: ReleaseType): number {
  const profile = ROYALTY_PROFILE[type]
  const raw = (quality / 100) * (fanBase * ROYALTY_FAN_WEIGHT + ROYALTY_BASE) * profile.multiplier
  return Math.round(raw)
}

// Acumula o royalty de `days` turnos a partir de `currentRoyalty` (pago no próximo turno),
// decaindo geometricamente a cada turno. Fechado: soma = c·(1−d^n)/(1−d); novo = c·d^n.
// Ao cair abaixo do piso, expira (next = 0).
export function accrueRoyalty(
  currentRoyalty: number,
  decay: number,
  days: number,
  floor: number = ROYALTY_FLOOR,
): { revenue: number; next: number } {
  if (currentRoyalty <= 0 || days <= 0) return { revenue: 0, next: Math.max(0, currentRoyalty) }
  const factor = Math.pow(decay, days)
  const revenue = (currentRoyalty * (1 - factor)) / (1 - decay)
  const next = currentRoyalty * factor
  return { revenue, next: next < floor ? 0 : next }
}

// Pool IP-safe para títulos de álbum (sabor, não referência a obras reais).
const ALBUM_TITLES = [
  'Ruído Branco',
  'Concreto',
  'Neon',
  'Asfalto',
  'Vertigem',
  'Insônia',
  'Combustão',
  'Manifesto',
  'Litoral',
  'Subúrbio',
] as const

export function generateAlbumTitle(rng: () => number = Math.random): string {
  return ALBUM_TITLES[Math.floor(rng() * ALBUM_TITLES.length)] ?? ALBUM_TITLES[0]
}

export function averageQuality(tracks: readonly Song[]): number {
  if (tracks.length === 0) return 0
  return Math.round(tracks.reduce((sum, t) => sum + t.quality, 0) / tracks.length)
}

function defaultTitle(type: ReleaseType, tracks: readonly Song[], rng: () => number): string {
  if (type === 'single') return tracks[0]?.name ?? generateAlbumTitle(rng)
  if (type === 'album') return generateAlbumTitle(rng)
  return 'Demo'
}

export interface CreateReleaseInput {
  id: string
  type: ReleaseType
  releaseTurn: number
  tracks: readonly Song[]
  fanBase: number // fãs no momento do lançamento (insumo do royalty inicial — D4)
  title?: string // override; autogerado se ausente
  rng?: () => number
}

export function createRelease(input: CreateReleaseInput): Release {
  const rng = input.rng ?? Math.random
  const quality = averageQuality(input.tracks)
  return {
    id: input.id,
    type: input.type,
    title: input.title ?? defaultTitle(input.type, input.tracks, rng),
    releaseTurn: input.releaseTurn,
    trackIds: input.tracks.map((t) => t.id),
    quality,
    fanBaseAtRelease: input.fanBase,
    currentRoyalty: initialRoyalty(quality, input.fanBase, input.type),
    totalRoyaltiesEarned: 0,
  }
}
