// Band Quest — modelo de música e geração de metadado (feature 0015, slice 1).
// Espelho de band-quest-docs/docs/features/songwriting-and-releases/refinement/iteration-01.md
//
// Música é objeto de 1ª classe (substitui o antigo contador `songs`): nome, gênero,
// tema e qualidade. Metadado é autogerado e EDITÁVEL (D1) — o gênero é herdado da banda.
// A qualidade (D2) combina, nesta slice, qualidade da banda + esforço + variação leve;
// o termo de ENTROSAMENTO (ensaio) entra na slice 2. Os NÚMEROS são placeholders de
// balance (feature 0003).

export type SongStatus = 'composed' | 'released'

export interface Song {
  id: string
  name: string
  genre: string
  theme: string
  quality: number // 0–100
  status: SongStatus
}

// Pools IP-safe para o nome autogerado (paródia/sabor, não referência a obras reais).
const NAME_ADJECTIVES = [
  'Última',
  'Primeira',
  'Nova',
  'Velha',
  'Longa',
  'Outra',
  'Falsa',
  'Pequena',
] as const

const NAME_NOUNS = [
  'Estrada',
  'Noite',
  'Cidade',
  'Saudade',
  'Canção',
  'Promessa',
  'Esquina',
  'Tempestade',
  'Manhã',
  'Despedida',
] as const

export const SONG_THEMES = [
  'Amor',
  'Estrada',
  'Saudade',
  'Rebeldia',
  'Cidade grande',
  'Noite',
  'Liberdade',
  'Despedida',
  'Festa',
  'Solidão',
] as const

// Gêneros selecionáveis na composição (0015 it-03 / Playtest 04 ponto 1.1). Lista
// estática IP-safe; a evolução por época ("invenção" de gêneros no tempo) é da 0008.
export const SONG_GENRES = [
  'Rock',
  'Pop Rock',
  'Punk',
  'Hard Rock',
  'Metal',
  'Grunge',
  'Indie',
  'Alternativo',
  'Pop',
  'MPB',
] as const

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)] ?? arr[0]!
}

// Gera um título no padrão "{Adjetivo} {Substantivo}" (ex.: "Última Estrada").
export function generateSongName(rng: () => number = Math.random): string {
  return `${pick(NAME_ADJECTIVES, rng)} ${pick(NAME_NOUNS, rng)}`
}

export function pickTheme(rng: () => number = Math.random): string {
  return pick(SONG_THEMES, rng)
}

export function pickGenre(rng: () => number = Math.random): string {
  return pick(SONG_GENRES, rng)
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export interface SongQualityInput {
  bandQuality: number // 0..1 (média dos atributos da banda, ver store)
  effortModifier?: number // outcomeModifier do esforço (1 = padrão); default 1
  rng?: () => number // determinismo em testes; default Math.random
}

// Qualidade 1–100. rng === () => 0.5 ⇒ sem variância (determinístico).
export function rollSongQuality({
  bandQuality,
  effortModifier = 1,
  rng = Math.random,
}: SongQualityInput): number {
  const base = bandQuality * 100 // talento bruto da banda
  const effortBonus = (effortModifier - 1) * 25 // caprichar rende qualidade, não só custo
  const variance = (rng() * 2 - 1) * 8 // ±8
  return clamp(Math.round(base * 0.85 + 10 + effortBonus + variance), 1, 100)
}

export interface CreateSongInput extends SongQualityInput {
  id: string
  genre: string // herdado da banda
  name?: string // override (metadado editável); autogerado se ausente
  theme?: string // override; autogerado se ausente
}

export function createSong(input: CreateSongInput): Song {
  const rng = input.rng ?? Math.random
  return {
    id: input.id,
    name: input.name ?? generateSongName(rng),
    genre: input.genre,
    theme: input.theme ?? pickTheme(rng),
    quality: rollSongQuality({
      bandQuality: input.bandQuality,
      effortModifier: input.effortModifier,
      rng,
    }),
    status: 'composed',
  }
}
