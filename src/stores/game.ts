import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createDefaultRoster, type BandMember } from '@/data/cast'
import { getAction, resolveEffort, resolveOutcome, type ActionLane } from '@/data/actions'

export interface BandStats {
  reputation: number // 0–100
  cash: number // in-game currency (R$); pode ficar negativo (dívida) — feature 0003
  fans: number // total fan count
  fatigue: number // 0–100; above 80 starts blocking actions
}

export type { BandMember }

// Categorias do feed de eventos (alinhadas a ActionCategory em data/actions.ts).
export type EventCategory =
  | 'show'
  | 'recording'
  | 'tour'
  | 'negotiation'
  | 'milestone'
  | 'setback'
  | 'marketing'
  | 'practice'
  | 'rest'

export interface GameEvent {
  id: string
  turn: number
  category: EventCategory
  message: string
}

// Ação em progresso no calendário (feature 0014).
export interface ActiveAction {
  actionId: string
  name: string
  lane: ActionLane
  category: EventCategory
  effortLabel: string
  turnsRemaining: number
  totalTurns: number
}

const INITIAL_STATS: BandStats = {
  reputation: 10,
  cash: 500,
  fans: 0,
  fatigue: 0,
}

// Turno = dia (0008 it-02 / 0003 it-04). Calendário regular: 12 meses × 30 dias.
export const DAYS_PER_MONTH = 30
export const MONTHS_PER_YEAR = 12
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR // 360

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export interface StartActionResult {
  ok: boolean
  reason?: string
}

export const useGameStore = defineStore('game', () => {
  const bandName = ref('')
  const genre = ref('')
  const originTrait = ref('')
  const turn = ref(0)
  const currentView = ref<'start' | 'game'>('start')

  const stats = ref<BandStats>({ ...INITIAL_STATS })
  const members = ref<BandMember[]>([])
  const events = ref<GameEvent[]>([])
  const songs = ref(0)
  const activeActions = ref<ActiveAction[]>([])

  let eventSeq = 0
  // Fonte de aleatoriedade injetável (determinismo em testes).
  let randomFn: () => number = Math.random

  const isGameStarted = computed(() => currentView.value === 'game')
  const isFatigued = computed(() => stats.value.fatigue >= 80)

  // Eventos mais recentes primeiro, para renderização direta na timeline.
  const recentEvents = computed(() => [...events.value].reverse())

  // Calendário derivado do turno (dia). Antes de começar: ano 1, dia 0.
  const calendar = computed(() => {
    if (turn.value < 1) return { year: 1, month: 1, monthName: MONTH_NAMES[0], day: 0 }
    const zero = turn.value - 1
    const dayOfYear = zero % DAYS_PER_YEAR
    const month = Math.floor(dayOfYear / DAYS_PER_MONTH) + 1
    return {
      year: Math.floor(zero / DAYS_PER_YEAR) + 1,
      month,
      monthName: MONTH_NAMES[month - 1] ?? MONTH_NAMES[0],
      day: (dayOfYear % DAYS_PER_MONTH) + 1,
    }
  })

  const activeMainAction = computed(
    () => activeActions.value.find((a) => a.lane === 'main') ?? null,
  )
  const canStartMain = computed(() => !activeMainAction.value && !isFatigued.value)

  // Dias até a próxima conclusão de ação (1 se não houver ações ativas).
  const nextCompletionDays = computed(() => {
    if (activeActions.value.length === 0) return 1
    return Math.min(...activeActions.value.map((a) => a.turnsRemaining))
  })

  // Qualidade da banda (0..1) = média dos atributos dos membros / 100.
  const bandQuality = computed(() => {
    const ms = members.value
    if (ms.length === 0) return 0
    const total = ms.reduce((sum, m) => {
      const a = m.attributes
      return sum + (a.technique + a.charisma + a.creativity + a.energy) / 4
    }, 0)
    return total / ms.length / 100
  })
  // Modulador aplicado aos ganhos positivos das ações (~1.0–1.2).
  const qualityModifier = computed(() => 0.8 + bandQuality.value * 0.4)

  function startGame(payload: { bandName: string; genre: string; originTrait: string }) {
    bandName.value = payload.bandName
    genre.value = payload.genre
    originTrait.value = payload.originTrait
    stats.value = { ...INITIAL_STATS }
    members.value = createDefaultRoster()
    events.value = []
    songs.value = 0
    activeActions.value = []
    eventSeq = 0
    turn.value = 1
    currentView.value = 'game'
    logEvent('milestone', `${payload.bandName} foi formada. Boa sorte!`)
  }

  function applyStatDelta(delta: Partial<BandStats>) {
    const s = stats.value
    if (delta.reputation !== undefined)
      s.reputation = Math.max(0, Math.min(100, s.reputation + delta.reputation))
    // Caixa pode ficar negativo (dívida) — feature 0003.
    if (delta.cash !== undefined) s.cash = s.cash + delta.cash
    if (delta.fans !== undefined) s.fans = Math.max(0, s.fans + delta.fans)
    if (delta.fatigue !== undefined)
      s.fatigue = Math.max(0, Math.min(100, s.fatigue + delta.fatigue))
  }

  function logEvent(category: EventCategory, message: string) {
    events.value.push({
      id: String(++eventSeq),
      turn: turn.value,
      category,
      message,
    })
  }

  // Verifica se uma ação pode iniciar agora (sem alterar o estado).
  function canStartAction(actionId: string, effortLabel?: string): StartActionResult {
    const action = getAction(actionId)
    if (action.lane === 'main') {
      if (activeMainAction.value) return { ok: false, reason: 'Já há uma ação principal em andamento.' }
      if (isFatigued.value && !action.allowWhenFatigued) {
        return { ok: false, reason: 'A banda está exausta. Descanse primeiro.' }
      }
    } else if (activeActions.value.some((a) => a.actionId === actionId)) {
      return { ok: false, reason: 'Essa ação já está em andamento.' }
    }
    const req = action.requires
    if (req?.reputation !== undefined && stats.value.reputation < req.reputation) {
      return { ok: false, reason: `Requer ${req.reputation} de reputação.` }
    }
    if (req?.songs !== undefined && songs.value < req.songs) {
      return { ok: false, reason: `Requer ${req.songs} música(s) pronta(s).` }
    }
    // effortLabel é validado por resolveEffort (cai na primeira opção se inválido).
    void effortLabel
    return { ok: true }
  }

  function startAction(actionId: string, effortLabel?: string): StartActionResult {
    const check = canStartAction(actionId, effortLabel)
    if (!check.ok) return check

    const action = getAction(actionId)
    const effort = resolveEffort(action, effortLabel)

    // Consome pré-requisitos ao iniciar.
    if (action.requires?.songs) songs.value -= action.requires.songs

    activeActions.value.push({
      actionId: action.id,
      name: action.name,
      lane: action.lane,
      category: action.category,
      effortLabel: effort.label,
      turnsRemaining: effort.durationTurns,
      totalTurns: effort.durationTurns,
    })
    return { ok: true }
  }

  function completeAction(active: ActiveAction) {
    const action = getAction(active.actionId)
    const effort = resolveEffort(action, active.effortLabel)
    const deltas = resolveOutcome(action, effort, {
      rng: randomFn,
      qualityModifier: qualityModifier.value,
    })
    applyStatDelta(deltas as Partial<BandStats>)
    if (action.produces?.songs) songs.value += action.produces.songs
    logEvent(active.category, completionMessage(active))
  }

  function completionMessage(active: ActiveAction): string {
    switch (active.actionId) {
      case 'compose':
        return 'Uma nova música está pronta.'
      case 'rehearse':
        return 'A banda ensaiou e está mais afiada.'
      case 'rest':
        return 'A banda descansou e recuperou energia.'
      case 'play-show':
        return 'A banda tocou um show e ganhou novos fãs.'
      case 'tour':
        return 'A turnê terminou — exaustiva, mas valeu a pena.'
      case 'marketing':
        return 'A campanha de divulgação rendeu novos fãs.'
      default:
        return `${active.name} concluído(a).`
    }
  }

  // Avança `days` dias: decrementa as ações ativas e conclui as que chegam a zero.
  function advanceDays(days: number) {
    if (days <= 0) return
    turn.value += days
    const remaining: ActiveAction[] = []
    const completed: ActiveAction[] = []
    for (const a of activeActions.value) {
      a.turnsRemaining -= days
      if (a.turnsRemaining <= 0) completed.push(a)
      else remaining.push(a)
    }
    activeActions.value = remaining
    for (const a of completed) completeAction(a)
  }

  // Salta o relógio até a próxima conclusão de ação (1 dia se nada estiver ativo).
  function advanceToNextCompletion() {
    advanceDays(nextCompletionDays.value)
  }

  function resetGame() {
    bandName.value = ''
    genre.value = ''
    originTrait.value = ''
    stats.value = { ...INITIAL_STATS }
    members.value = []
    events.value = []
    songs.value = 0
    activeActions.value = []
    eventSeq = 0
    turn.value = 0
    currentView.value = 'start'
  }

  // Seam de teste: injeta uma fonte de aleatoriedade determinística.
  function setRandomSource(fn: () => number) {
    randomFn = fn
  }

  return {
    bandName,
    genre,
    originTrait,
    turn,
    currentView,
    stats,
    members,
    events,
    songs,
    activeActions,
    isGameStarted,
    isFatigued,
    recentEvents,
    calendar,
    activeMainAction,
    canStartMain,
    nextCompletionDays,
    bandQuality,
    qualityModifier,
    startGame,
    applyStatDelta,
    logEvent,
    canStartAction,
    startAction,
    advanceDays,
    advanceToNextCompletion,
    resetGame,
    setRandomSource,
  }
})
