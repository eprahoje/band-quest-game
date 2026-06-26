// Band Quest — modelo de lançamento e regras de composição (feature 0015, slice 3).
// Espelho de band-quest-docs/docs/features/songwriting-and-releases/refinement/iteration-01.md (D3)
//
// Cadeia composição → Demo / Single / Álbum. Um lançamento (Release) referencia as
// músicas que o compõem (trackIds). A receita de longo prazo (royalties) é a slice 4 —
// aqui ficam apenas a estrutura e as regras de composição. NÚMEROS = placeholders (0003).

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
  // Slice 4 (royalties) acrescentará: fanBaseAtRelease, currentRoyalty, etc.
}

// Regras de composição (D3). NÚMEROS = placeholders de balance (0003).
// demo: N músicas; single: 1 música; álbum: X singles já lançados + Y músicas novas.
export const RELEASE_RULES: Record<ReleaseType, { songs?: number; singles?: number }> = {
  demo: { songs: 3 },
  single: { songs: 1 },
  album: { singles: 2, songs: 4 },
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
  title?: string // override; autogerado se ausente
  rng?: () => number
}

export function createRelease(input: CreateReleaseInput): Release {
  const rng = input.rng ?? Math.random
  return {
    id: input.id,
    type: input.type,
    title: input.title ?? defaultTitle(input.type, input.tracks, rng),
    releaseTurn: input.releaseTurn,
    trackIds: input.tracks.map((t) => t.id),
    quality: averageQuality(input.tracks),
  }
}
