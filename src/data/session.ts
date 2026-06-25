// Band Quest — modos de sessão e nota final (feature 0010).
// Espelho de band-quest-docs/docs/features/session-modes-and-outcomes.
//
// Modos temporizados (10/20/30 anos) terminam com uma NOTA em estrelas (1–5),
// derivada de um score combinado escalável pela duração. O modo livre não termina.
// Os números são placeholders de balance (0003) — afinar jogando.

export type SessionMode = 'timed' | 'free'

export interface SessionConfig {
  mode: SessionMode
  durationYears: number // anos (modos temporizados); 0 no modo livre
}

export const TIMED_DURATIONS = [10, 20, 30] as const

export interface SessionScoreInput {
  reputation: number
  fans: number
  cash: number
}

// Score combinado (0010): média ponderada de status positivos.
// Reputação conta direto; fãs e caixa entram normalizados (por 100).
export function computeScore(s: SessionScoreInput): number {
  return Math.round(s.reputation + s.fans / 100 + Math.max(0, s.cash) / 100)
}

// Faixas de score por estrela (base 10 anos), escaláveis pela duração.
// Índices: [2★, 3★, 4★, 5★]. Abaixo de 2★ → 1★.
const STAR_THRESHOLDS = [120, 250, 400, 600] as const

export function computeStars(score: number, durationYears: number): number {
  const scale = durationYears / 10
  const t = STAR_THRESHOLDS.map((x) => x * scale)
  if (score >= t[3]!) return 5
  if (score >= t[2]!) return 4
  if (score >= t[1]!) return 3
  if (score >= t[0]!) return 2
  return 1
}

export type SessionOutcomeType = 'success' | 'defeat'

export interface SessionOutcome {
  type: SessionOutcomeType
  score?: number // sucesso (temporizado)
  stars?: number // sucesso (temporizado)
  reason?: string // derrota (ex.: "Falência")
}
