// Band Quest — modelo de ação e catálogo do core loop (feature 0014).
// Espelho de band-quest-docs/docs/features/core-loop-and-actions/planning/design.md
//
// Turno = dia (0008 it-02 / 0003 it-04; calendário 12×30 = 360 dias/ano). Ações têm
// duração variável em dias e um ciclo de vida (idle → in-progress → completed). O
// tempo avança pelas ações (ver store). Os NÚMEROS abaixo são placeholders de balance
// (feature 0003) — serão calibrados numa iteração dedicada.

import type { ReleaseType } from './releases'

export type ActionLane = 'main' | 'background'

// Categorias reaproveitam o EventCategory do store (feed de eventos).
export type ActionCategory = 'show' | 'recording' | 'tour' | 'marketing' | 'practice' | 'rest'

// Métricas que uma ação pode afetar (alinhadas a BandStats no store).
export const ACTION_STATS = ['cash', 'reputation', 'fans', 'fatigue'] as const
export type ActionStat = (typeof ACTION_STATS)[number]

export interface ActionEffortOption {
  label: string
  durationTurns: number // dias (turno = dia)
  costModifier: number // multiplica o custo (cash negativo)
  // Escala os ganhos positivos (fãs/reputação/cachê). Mais esforço = mais qualidade,
  // tornando "caprichado" um trade-off real (0003 it-05). Default 1.
  outcomeModifier: number
}

export interface ActionRequirements {
  songs?: number // músicas prontas necessárias (consumidas ao iniciar)
  singles?: number // singles já lançados necessários (absorvidos pelo álbum) — feature 0015
  reputation?: number // reputação mínima
}

export interface ActionProduction {
  songs?: number // músicas produzidas ao concluir
}

export interface ActionOutcome {
  // deltas-base aplicados ao concluir (placeholders de balance — 0003).
  metrics: Partial<Record<ActionStat, number>>
  variance: number // 0..1: amplitude da aleatoriedade leve (Q4)
  // Reputação por FAIXA aleatória [min, max] (0014 it-07 / Playtest 04 ponto 4): quando
  // presente, sobrepõe `metrics.reputation` com um inteiro sorteado no intervalo (ex.:
  // shows locais rendem 1–5). Placeholder de balance (0003).
  reputationRange?: readonly [number, number]
  eventChance?: number // chance de evento (0009) — interrupção fica para a slice da 0009
}

export interface ActionDef {
  id: string
  name: string
  lane: ActionLane
  category: ActionCategory
  description: string
  effortOptions: ActionEffortOption[]
  requires?: ActionRequirements
  produces?: ActionProduction
  // Lançamento gerado ao concluir (feature 0015): demo | single | album.
  release?: ReleaseType
  outcome: ActionOutcome
  // Cachê escala com a reputação (0014 it-06 / Playtest 04 ponto 4): shows e turnês
  // pagam mais conforme a banda fica conhecida. Aplica-se só ao cash positivo.
  cashScalesWithReputation?: boolean
  // Fadiga acumulada POR DIA enquanto a ação está em curso (0014 it-04). Substitui o
  // antigo lump-sum de fadiga na conclusão: a fadiga total fica proporcional à duração
  // (turnê longa cansa mais que curta). Negativo = recuperação ativa (descansar).
  // Omitido = não mexe na fadiga (ex.: marketing em background).
  fatiguePerDay?: number
  // Ações de recuperação (ex.: descansar) podem ser iniciadas mesmo com a banda
  // exausta — caso contrário a fadiga vira um soft-lock (playtest 2026-06-24, ponto 2).
  allowWhenFatigued?: boolean
}

export const ACTIONS: readonly ActionDef[] = [
  {
    id: 'rehearse',
    name: 'Ensaiar',
    lane: 'main',
    category: 'practice',
    description: 'A banda ensaia e ganha entrosamento.',
    effortOptions: [
      { label: 'Ensaio leve', durationTurns: 2, costModifier: 1, outcomeModifier: 1 },
      { label: 'Ensaio pesado', durationTurns: 4, costModifier: 1, outcomeModifier: 1.6 },
    ],
    fatiguePerDay: 4,
    outcome: { metrics: { reputation: 1 }, variance: 0.1 },
  },
  {
    id: 'compose',
    name: 'Compor',
    lane: 'main',
    category: 'recording',
    description: 'Compõe uma nova música (insumo para gravar).',
    effortOptions: [{ label: 'Compor', durationTurns: 5, costModifier: 1, outcomeModifier: 1 }],
    produces: { songs: 1 },
    fatiguePerDay: 1.5,
    outcome: { metrics: {}, variance: 0.15 },
  },
  {
    id: 'record-demo',
    name: 'Gravar demo',
    lane: 'main',
    category: 'recording',
    description: 'Junta 3 músicas numa demo caseira — degrau de início de carreira.',
    effortOptions: [{ label: 'Demo caseira', durationTurns: 3, costModifier: 1, outcomeModifier: 1 }],
    requires: { songs: 3 },
    release: 'demo',
    fatiguePerDay: 1.5,
    outcome: { metrics: { cash: -150, reputation: 1, fans: 25 }, variance: 0.2 },
  },
  {
    id: 'record-single',
    name: 'Gravar single',
    lane: 'main',
    category: 'recording',
    description: 'Grava e lança um single a partir de 1 música.',
    effortOptions: [
      { label: 'Single', durationTurns: 10, costModifier: 1, outcomeModifier: 1 },
      { label: 'Single caprichado', durationTurns: 16, costModifier: 1.6, outcomeModifier: 1.7 },
    ],
    requires: { songs: 1 },
    release: 'single',
    fatiguePerDay: 1.5,
    outcome: { metrics: { cash: -400, reputation: 2, fans: 120 }, variance: 0.2 },
  },
  {
    id: 'record-album',
    name: 'Gravar álbum',
    lane: 'main',
    category: 'recording',
    description: 'Lança um álbum: exige 2 singles já lançados + 4 músicas novas.',
    effortOptions: [
      { label: 'Álbum', durationTurns: 35, costModifier: 1, outcomeModifier: 1 },
      { label: 'Álbum caprichado', durationTurns: 50, costModifier: 1.7, outcomeModifier: 1.8 },
    ],
    requires: { singles: 2, songs: 4 },
    release: 'album',
    fatiguePerDay: 1.5,
    outcome: { metrics: { cash: -1500, reputation: 6, fans: 600 }, variance: 0.25 },
  },
  {
    id: 'play-show',
    name: 'Tocar show',
    lane: 'main',
    category: 'show',
    description: 'Toca um show e ganha cachê, fãs e reputação.',
    effortOptions: [{ label: 'Show local', durationTurns: 1, costModifier: 1, outcomeModifier: 1 }],
    fatiguePerDay: 18,
    cashScalesWithReputation: true,
    // Reputação do show é sorteada entre 1 e 5 (Playtest 04 ponto 4) — sem valor fixo.
    outcome: { metrics: { cash: 150, fans: 30 }, variance: 0.2, reputationRange: [1, 5] },
  },
  {
    id: 'tour',
    name: 'Turnê',
    lane: 'main',
    category: 'tour',
    description: 'Sai em turnê: muito retorno, muito desgaste.',
    effortOptions: [
      { label: 'Mini-turnê', durationTurns: 14, costModifier: 1, outcomeModifier: 1 },
      { label: 'Turnê nacional', durationTurns: 45, costModifier: 1.5, outcomeModifier: 1.6 },
    ],
    requires: { reputation: 30 },
    fatiguePerDay: 2,
    cashScalesWithReputation: true,
    outcome: { metrics: { cash: 1800, reputation: 5, fans: 500 }, variance: 0.25 },
  },
  {
    id: 'marketing',
    name: 'Marketing',
    lane: 'background',
    category: 'marketing',
    description: 'Campanha de divulgação que roda em paralelo.',
    effortOptions: [{ label: 'Campanha', durationTurns: 14, costModifier: 1, outcomeModifier: 1 }],
    outcome: { metrics: { cash: -300, fans: 90 }, variance: 0.2 },
  },
  {
    id: 'rest',
    name: 'Descansar',
    lane: 'main',
    category: 'rest',
    description: 'A banda descansa e recupera energia.',
    effortOptions: [{ label: 'Descanso', durationTurns: 5, costModifier: 1, outcomeModifier: 1 }],
    fatiguePerDay: -6,
    outcome: { metrics: {}, variance: 0 },
    allowWhenFatigued: true,
  },
]

export function getAction(id: string): ActionDef {
  const a = ACTIONS.find((x) => x.id === id)
  if (!a) throw new Error(`Unknown action: ${id}`)
  return a
}

// Resolve a opção de esforço por label; cai na primeira (sempre existe ≥ 1).
export function resolveEffort(action: ActionDef, label?: string): ActionEffortOption {
  const opt = label ? action.effortOptions.find((o) => o.label === label) : undefined
  return opt ?? action.effortOptions[0]!
}

export interface ResolveContext {
  rng?: () => number // 0..1, default Math.random
  qualityModifier?: number // default 1: escala ganhos positivos (não a fadiga)
  // Multiplicador de cachê por reputação (0014 it-06), aplicado ao cash positivo das
  // ações com `cashScalesWithReputation`. Default 1 (sem efeito).
  reputationCashMultiplier?: number
}

// Calcula os deltas de uma ação concluída (puro/testável).
// rng === () => 0.5 ⇒ sem variância (fator 1), determinístico.
export function resolveOutcome(
  action: ActionDef,
  effort: ActionEffortOption,
  ctx: ResolveContext = {},
): Partial<Record<ActionStat, number>> {
  const rng = ctx.rng ?? Math.random
  const quality = ctx.qualityModifier ?? 1
  const repCashMult = ctx.reputationCashMultiplier ?? 1
  const factor = 1 + (rng() * 2 - 1) * action.outcome.variance
  const result: Partial<Record<ActionStat, number>> = {}
  for (const key of ACTION_STATS) {
    const base = action.outcome.metrics[key]
    if (base === undefined) continue
    let v = base
    if (key === 'cash' && base < 0) v *= effort.costModifier
    // ganhos positivos (não fadiga) escalam com a qualidade da banda E o esforço
    if (base > 0 && key !== 'fatigue') v *= quality * effort.outcomeModifier
    // cachê (cash positivo) escala com a reputação nas ações marcadas (Playtest 04 ponto 4)
    if (key === 'cash' && base > 0 && action.cashScalesWithReputation) v *= repCashMult
    v *= factor
    result[key] = Math.round(v)
  }
  // Reputação por faixa aleatória (Playtest 04 ponto 4): sobrepõe o valor-base.
  if (action.outcome.reputationRange) {
    const [lo, hi] = action.outcome.reputationRange
    result.reputation = lo + Math.floor(rng() * (hi - lo + 1))
  }
  return result
}
