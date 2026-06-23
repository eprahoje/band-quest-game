import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface BandStats {
  reputation: number // 0–100
  cash: number // in-game currency (R$)
  fans: number // total fan count
  fatigue: number // 0–100; above 80 starts blocking actions
}

export interface BandMember {
  id: string
  name: string
  role: string
  skill: number // 0–100
}

export type EventCategory =
  | 'show'
  | 'recording'
  | 'tour'
  | 'negotiation'
  | 'milestone'
  | 'setback'

export interface GameEvent {
  id: string
  turn: number
  category: EventCategory
  message: string
}

export interface GameState {
  bandName: string
  genre: string
  originTrait: string
  stats: BandStats
  members: BandMember[]
  events: GameEvent[]
  turn: number
  currentView: 'start' | 'game'
}

const INITIAL_STATS: BandStats = {
  reputation: 10,
  cash: 500,
  fans: 0,
  fatigue: 0,
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

  let eventSeq = 0

  const isGameStarted = computed(() => currentView.value === 'game')
  const isFatigued = computed(() => stats.value.fatigue >= 80)

  // Eventos mais recentes primeiro, para renderização direta na timeline.
  const recentEvents = computed(() => [...events.value].reverse())

  function startGame(payload: { bandName: string; genre: string; originTrait: string }) {
    bandName.value = payload.bandName
    genre.value = payload.genre
    originTrait.value = payload.originTrait
    stats.value = { ...INITIAL_STATS }
    events.value = []
    eventSeq = 0
    turn.value = 1
    currentView.value = 'game'
    logEvent('milestone', `${payload.bandName} foi formada. Boa sorte!`)
  }

  function applyStatDelta(delta: Partial<BandStats>) {
    const s = stats.value
    if (delta.reputation !== undefined)
      s.reputation = Math.max(0, Math.min(100, s.reputation + delta.reputation))
    if (delta.cash !== undefined) s.cash = Math.max(0, s.cash + delta.cash)
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

  function advanceTurn() {
    turn.value++
  }

  function resetGame() {
    bandName.value = ''
    genre.value = ''
    originTrait.value = ''
    stats.value = { ...INITIAL_STATS }
    members.value = []
    events.value = []
    eventSeq = 0
    turn.value = 0
    currentView.value = 'start'
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
    isGameStarted,
    isFatigued,
    recentEvents,
    startGame,
    applyStatDelta,
    logEvent,
    advanceTurn,
    resetGame,
  }
})
