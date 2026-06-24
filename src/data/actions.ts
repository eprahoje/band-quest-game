// Band Quest — modelo de ação e catálogo do core loop (feature 0014).
// Espelho de band-quest-docs/docs/features/core-loop-and-actions/planning/design.md
//
// Turno = semana (0003/0008). Ações têm duração variável em turnos e um ciclo de
// vida (idle → in-progress → completed). Os NÚMEROS abaixo são placeholders de
// balance (feature 0003) — serão calibrados numa iteração dedicada.

export type ActionLane = 'main' | 'background'

// Categorias reaproveitam o EventCategory do store (feed de eventos).
export type ActionCategory = 'show' | 'recording' | 'tour' | 'marketing' | 'practice' | 'rest'

// Métricas que uma ação pode afetar (alinhadas a BandStats no store).
export const ACTION_STATS = ['cash', 'reputation', 'fans', 'fatigue'] as const
export type ActionStat = (typeof ACTION_STATS)[number]

export interface ActionEffortOption {
  label: string
  durationTurns: number // semanas
  costModifier: number // multiplica o custo (cash negativo)
}

export interface ActionRequirements {
  songs?: number // músicas prontas necessárias (consumidas ao iniciar)
  reputation?: number // reputação mínima
}

export interface ActionProduction {
  songs?: number // músicas produzidas ao concluir
}

export interface ActionOutcome {
  // deltas-base aplicados ao concluir (placeholders de balance — 0003).
  metrics: Partial<Record<ActionStat, number>>
  variance: number // 0..1: amplitude da aleatoriedade leve (Q4)
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
  outcome: ActionOutcome
}

export const ACTIONS: readonly ActionDef[] = [
  {
    id: 'rehearse',
    name: 'Ensaiar',
    lane: 'main',
    category: 'practice',
    description: 'A banda ensaia e ganha entrosamento.',
    effortOptions: [
      { label: 'Ensaio leve', durationTurns: 1, costModifier: 1 },
      { label: 'Ensaio pesado', durationTurns: 2, costModifier: 1 },
    ],
    outcome: { metrics: { reputation: 1, fatigue: 8 }, variance: 0.1 },
  },
  {
    id: 'compose',
    name: 'Compor',
    lane: 'main',
    category: 'recording',
    description: 'Compõe uma nova música (insumo para gravar).',
    effortOptions: [{ label: 'Compor', durationTurns: 2, costModifier: 1 }],
    produces: { songs: 1 },
    outcome: { metrics: { fatigue: 6 }, variance: 0.15 },
  },
  {
    id: 'record-demo',
    name: 'Gravar demo',
    lane: 'main',
    category: 'recording',
    description: 'Grava uma demo caseira a partir de uma música.',
    effortOptions: [{ label: 'Demo caseira', durationTurns: 1, costModifier: 1 }],
    requires: { songs: 1 },
    outcome: { metrics: { cash: -100, reputation: 2, fans: 20 }, variance: 0.2 },
  },
  {
    id: 'record-single',
    name: 'Gravar single',
    lane: 'main',
    category: 'recording',
    description: 'Grava e lança um single.',
    effortOptions: [
      { label: 'Single', durationTurns: 2, costModifier: 1 },
      { label: 'Single caprichado', durationTurns: 3, costModifier: 1.6 },
    ],
    requires: { songs: 1 },
    outcome: { metrics: { cash: -300, reputation: 4, fans: 120 }, variance: 0.2 },
  },
  {
    id: 'record-album',
    name: 'Gravar álbum',
    lane: 'main',
    category: 'recording',
    description: 'Grava um álbum completo a partir de várias músicas.',
    effortOptions: [
      { label: 'Álbum', durationTurns: 4, costModifier: 1 },
      { label: 'Álbum caprichado', durationTurns: 6, costModifier: 1.7 },
    ],
    requires: { songs: 3 },
    outcome: { metrics: { cash: -1200, reputation: 12, fans: 600 }, variance: 0.25 },
  },
  {
    id: 'play-show',
    name: 'Tocar show',
    lane: 'main',
    category: 'show',
    description: 'Toca um show e ganha cachê, fãs e reputação.',
    effortOptions: [{ label: 'Show local', durationTurns: 1, costModifier: 1 }],
    outcome: { metrics: { cash: 200, reputation: 3, fans: 40, fatigue: 15 }, variance: 0.2 },
  },
  {
    id: 'tour',
    name: 'Turnê',
    lane: 'main',
    category: 'tour',
    description: 'Sai em turnê: muito retorno, muito desgaste.',
    effortOptions: [
      { label: 'Mini-turnê', durationTurns: 3, costModifier: 1 },
      { label: 'Turnê nacional', durationTurns: 6, costModifier: 1.5 },
    ],
    requires: { reputation: 30 },
    outcome: { metrics: { cash: 1500, reputation: 8, fans: 500, fatigue: 45 }, variance: 0.25 },
  },
  {
    id: 'marketing',
    name: 'Marketing',
    lane: 'background',
    category: 'marketing',
    description: 'Campanha de divulgação que roda em paralelo.',
    effortOptions: [{ label: 'Campanha', durationTurns: 2, costModifier: 1 }],
    outcome: { metrics: { cash: -200, fans: 80 }, variance: 0.2 },
  },
  {
    id: 'rest',
    name: 'Descansar',
    lane: 'main',
    category: 'rest',
    description: 'A banda descansa e recupera energia.',
    effortOptions: [{ label: 'Descanso', durationTurns: 1, costModifier: 1 }],
    outcome: { metrics: { fatigue: -30 }, variance: 0 },
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
  const factor = 1 + (rng() * 2 - 1) * action.outcome.variance
  const result: Partial<Record<ActionStat, number>> = {}
  for (const key of ACTION_STATS) {
    const base = action.outcome.metrics[key]
    if (base === undefined) continue
    let v = base
    if (key === 'cash' && base < 0) v *= effort.costModifier
    if (base > 0 && key !== 'fatigue') v *= quality
    v *= factor
    result[key] = Math.round(v)
  }
  return result
}
