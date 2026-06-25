import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game'
import { validateRoster } from '@/data/cast'

describe('game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts on start screen with zeroed stats', () => {
      const store = useGameStore()
      expect(store.currentView).toBe('start')
      expect(store.turn).toBe(0)
      expect(store.stats.reputation).toBe(0)
      expect(store.stats.cash).toBe(500)
      expect(store.stats.fans).toBe(0)
      expect(store.stats.fatigue).toBe(0)
    })

    it('isGameStarted is false before startGame', () => {
      const store = useGameStore()
      expect(store.isGameStarted).toBe(false)
    })
  })

  describe('startGame', () => {
    it('sets band data and transitions to game view', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'The Fuzz', genre: 'Rock', originTrait: 'Banda de Garagem' })
      expect(store.bandName).toBe('The Fuzz')
      expect(store.genre).toBe('Rock')
      expect(store.currentView).toBe('game')
      expect(store.turn).toBe(1)
      expect(store.isGameStarted).toBe(true)
    })

    it('resets stats to initial values on new game', () => {
      const store = useGameStore()
      store.applyStatDelta({ cash: 99999 })
      store.startGame({ bandName: 'B', genre: 'Pop', originTrait: 'Universitários' })
      expect(store.stats.cash).toBe(500)
    })
  })

  describe('roster', () => {
    it('seeds a valid default roster on startGame', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      expect(store.members).toHaveLength(4)
      expect(validateRoster(store.members).valid).toBe(true)
    })

    it('clears the roster on resetGame', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.resetGame()
      expect(store.members).toEqual([])
    })
  })

  describe('applyStatDelta', () => {
    it('adds delta to stats', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.applyStatDelta({ reputation: 20, cash: -200, fans: 150 })
      expect(store.stats.reputation).toBe(20)
      expect(store.stats.cash).toBe(300)
      expect(store.stats.fans).toBe(150)
    })

    it('floors reputation at 0 but has no upper cap (Playtest 02)', () => {
      const store = useGameStore()
      store.applyStatDelta({ reputation: 999 })
      expect(store.stats.reputation).toBe(999) // sem teto
      store.applyStatDelta({ reputation: -9999 })
      expect(store.stats.reputation).toBe(0) // piso 0
    })

    it('clamps fatigue between 0 and 100', () => {
      const store = useGameStore()
      store.applyStatDelta({ fatigue: 999 })
      expect(store.stats.fatigue).toBe(100)
    })

    it('allows cash to go negative (debt) — feature 0003', () => {
      const store = useGameStore()
      store.applyStatDelta({ cash: -99999 })
      expect(store.stats.cash).toBe(500 - 99999)
    })

    it('still floors fans at zero', () => {
      const store = useGameStore()
      store.applyStatDelta({ fans: -50 })
      expect(store.stats.fans).toBe(0)
    })
  })

  describe('isFatigued', () => {
    it('is false below 80', () => {
      const store = useGameStore()
      store.applyStatDelta({ fatigue: 79 })
      expect(store.isFatigued).toBe(false)
    })

    it('is true at 80 or above', () => {
      const store = useGameStore()
      store.applyStatDelta({ fatigue: 80 })
      expect(store.isFatigued).toBe(true)
    })
  })

  describe('advancing time', () => {
    it('advances 1 day when nothing is active (advanceToNextCompletion)', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.advanceToNextCompletion()
      expect(store.turn).toBe(2)
    })

    it('advanceDays jumps the clock by the given number of days', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.advanceDays(10)
      expect(store.turn).toBe(11)
    })
  })

  describe('calendar (turn = day)', () => {
    it('maps turn 1 to year 1 / month 1 / day 1, starting in 2000', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      expect(store.calendar).toMatchObject({
        year: 1,
        month: 1,
        monthName: 'Janeiro',
        day: 1,
        displayYear: 2000,
      })
    })

    it('rolls into the next month after 30 days', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.advanceDays(30) // turn 1 -> 31
      expect(store.turn).toBe(31)
      expect(store.calendar).toMatchObject({ year: 1, month: 2, monthName: 'Fevereiro', day: 1 })
    })

    it('rolls into the next year after 360 days', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.advanceDays(360) // turn 1 -> 361
      expect(store.turn).toBe(361)
      expect(store.calendar).toMatchObject({ year: 2, month: 1, day: 1, displayYear: 2001 })
    })
  })

  describe('actions engine', () => {
    function freshGame() {
      const store = useGameStore()
      store.setRandomSource(() => 0.5) // determinístico
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      return store
    }

    it('queues a main action and blocks a second main action', () => {
      const store = freshGame()
      expect(store.startAction('play-show').ok).toBe(true)
      expect(store.activeMainAction?.actionId).toBe('play-show')
      expect(store.canStartMain).toBe(false)
      const second = store.startAction('rehearse')
      expect(second.ok).toBe(false)
    })

    it('completes a finished action and applies its outcome', () => {
      const store = freshGame()
      const cashBefore = store.stats.cash
      store.startAction('play-show') // duração 1 dia
      store.advanceToNextCompletion()
      expect(store.activeActions).toHaveLength(0)
      expect(store.stats.cash).toBeGreaterThan(cashBefore)
      expect(store.stats.fans).toBeGreaterThan(0)
      expect(store.recentEvents[0]?.category).toBe('show')
    })

    it('keeps a multi-day action active until its duration elapses', () => {
      const store = freshGame()
      store.startAction('compose') // duração em dias, produz 1 música
      store.advanceDays(1)
      expect(store.activeActions).toHaveLength(1)
      expect(store.songs).toBe(0)
      store.advanceToNextCompletion() // salta o restante até concluir
      expect(store.activeActions).toHaveLength(0)
      expect(store.songs).toBe(1)
    })

    it('consumes a song when starting a recording that requires it', () => {
      const store = freshGame()
      // produz uma música via compose
      store.startAction('compose')
      store.advanceToNextCompletion()
      expect(store.songs).toBe(1)
      const rec = store.startAction('record-demo') // requer 1 música
      expect(rec.ok).toBe(true)
      expect(store.songs).toBe(0)
    })

    it('blocks recording when there are not enough songs', () => {
      const store = freshGame()
      const rec = store.startAction('record-album') // requer 3 músicas
      expect(rec.ok).toBe(false)
    })

    it('blocks a main action when the band is fatigued', () => {
      const store = freshGame()
      store.applyStatDelta({ fatigue: 80 })
      expect(store.isFatigued).toBe(true)
      expect(store.canStartAction('play-show').ok).toBe(false)
    })

    it('allows resting even when fatigued (no soft-lock) and recovers energy', () => {
      const store = freshGame()
      store.applyStatDelta({ fatigue: 90 })
      expect(store.isFatigued).toBe(true)
      // descansar NÃO pode ser bloqueado pela fadiga (playtest 2026-06-24, ponto 2)
      expect(store.canStartAction('rest').ok).toBe(true)
      expect(store.startAction('rest').ok).toBe(true)
      store.advanceToNextCompletion() // 5 dias: -5 passivo + -30 do descanso
      expect(store.stats.fatigue).toBe(55) // 90 - 5 - 30
      expect(store.isFatigued).toBe(false)
    })

    it('runs a background action in parallel with a main action', () => {
      const store = freshGame()
      expect(store.startAction('play-show').ok).toBe(true)
      expect(store.startAction('marketing').ok).toBe(true)
      expect(store.activeActions).toHaveLength(2)
    })

    it('requires minimum reputation for a tour', () => {
      const store = freshGame()
      expect(store.startAction('tour').ok).toBe(false) // reputação inicial 0
      store.applyStatDelta({ reputation: 35 }) // -> 35 (>= 30)
      expect(store.canStartAction('tour').ok).toBe(true)
    })

    it('clears active actions and songs on a new game', () => {
      const store = freshGame()
      store.startAction('play-show')
      store.startGame({ bandName: 'C', genre: 'Pop', originTrait: 'Garagem' })
      expect(store.activeActions).toHaveLength(0)
      expect(store.songs).toBe(0)
    })
  })

  describe('resetGame', () => {
    it('returns all state to initial values', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.applyStatDelta({ reputation: 50, fans: 1000, fatigue: 90 })
      store.resetGame()
      expect(store.currentView).toBe('start')
      expect(store.turn).toBe(0)
      expect(store.stats.fans).toBe(0)
      expect(store.stats.fatigue).toBe(0)
      expect(store.bandName).toBe('')
      expect(store.events).toEqual([])
    })
  })

  describe('economy: monthly costs & reputation decay (0003 it-05)', () => {
    function freshGame() {
      const store = useGameStore()
      store.setRandomSource(() => 0.5)
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      return store
    }

    it('monthly member cost grows with reputation', () => {
      const store = freshGame()
      expect(store.monthlyMemberCost).toBe(400) // 4 membros × 100 × (1 + 0/100)
      store.applyStatDelta({ reputation: 40 }) // 0 -> 40
      expect(store.monthlyMemberCost).toBe(560) // 4 × 100 × 1.4
    })

    it('charges the monthly cost when a month boundary is crossed', () => {
      const store = freshGame()
      store.advanceDays(30) // turn 1 -> 31 (cruza 1 mês)
      expect(store.stats.cash).toBe(500 - 400)
      expect(store.recentEvents[0]?.category).toBe('negotiation')
    })

    it('does not charge before completing a full month', () => {
      const store = freshGame()
      store.advanceDays(29)
      expect(store.stats.cash).toBe(500)
    })

    it('decays reputation after the inactivity grace period', () => {
      const store = freshGame()
      store.applyStatDelta({ reputation: 40 }) // 0 -> 40, para enxergar o decay
      store.advanceDays(40) // 30 de carência + 10 inativos => -1 de reputação
      expect(store.stats.reputation).toBe(39)
    })

    it('public activity resets the inactivity counter', () => {
      const store = freshGame()
      store.advanceDays(35) // acumula inatividade (ainda sem decay: 5 além da carência)
      expect(store.inactiveDays).toBe(35)
      store.startAction('play-show')
      store.advanceToNextCompletion() // show é atividade pública
      expect(store.inactiveDays).toBe(0)
    })

    it('recovers a bit of fatigue passively as time passes (Playtest 02)', () => {
      const store = freshGame()
      store.applyStatDelta({ fatigue: 50 })
      store.advanceDays(10) // -1 de fadiga por dia
      expect(store.stats.fatigue).toBe(40)
    })

    it('completion events report the applied effects (Playtest 02)', () => {
      const store = freshGame()
      store.startAction('play-show')
      store.advanceToNextCompletion()
      const msg = store.recentEvents[0]?.message ?? ''
      expect(msg).toContain('fãs')
      expect(msg).toContain('R$')
    })
  })

  describe('events', () => {
    it('starts with no events before a game begins', () => {
      const store = useGameStore()
      expect(store.events).toEqual([])
      expect(store.recentEvents).toEqual([])
    })

    it('logs an opening milestone when the game starts', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'The Fuzz', genre: 'Rock', originTrait: 'Garagem' })
      expect(store.events).toHaveLength(1)
      expect(store.events[0]!.category).toBe('milestone')
      expect(store.events[0]!.message).toContain('The Fuzz')
      expect(store.events[0]!.turn).toBe(1)
    })

    it('appends events with the current turn and a unique id', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.logEvent('show', 'Primeiro show!')
      store.advanceDays(1)
      store.logEvent('recording', 'Gravamos a demo.')
      expect(store.events).toHaveLength(3)
      const ids = store.events.map((e) => e.id)
      expect(new Set(ids).size).toBe(3)
      expect(store.events[1]).toMatchObject({ category: 'show', turn: 1 })
      expect(store.events[2]).toMatchObject({ category: 'recording', turn: 2 })
    })

    it('recentEvents returns events most-recent-first without mutating source', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.logEvent('show', 'A')
      store.logEvent('setback', 'B')
      const recent = store.recentEvents
      expect(recent[0]!.message).toBe('B')
      expect(recent[1]!.message).toBe('A')
      expect(recent[2]!.category).toBe('milestone')
      // ordem original preservada
      expect(store.events[0]!.category).toBe('milestone')
    })

    it('clears events and id sequence on a new game', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'A', genre: 'Rock', originTrait: 'Garagem' })
      store.logEvent('show', 'old')
      store.startGame({ bandName: 'B', genre: 'Pop', originTrait: 'Universitários' })
      expect(store.events).toHaveLength(1)
      expect(store.events[0]!.id).toBe('1')
    })
  })
})
