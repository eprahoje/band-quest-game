import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game'

describe('game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts on start screen with zeroed stats', () => {
      const store = useGameStore()
      expect(store.currentView).toBe('start')
      expect(store.turn).toBe(0)
      expect(store.stats.reputation).toBe(10)
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

  describe('applyStatDelta', () => {
    it('adds delta to stats', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.applyStatDelta({ reputation: 20, cash: -200, fans: 150 })
      expect(store.stats.reputation).toBe(30)
      expect(store.stats.cash).toBe(300)
      expect(store.stats.fans).toBe(150)
    })

    it('clamps reputation between 0 and 100', () => {
      const store = useGameStore()
      store.applyStatDelta({ reputation: 999 })
      expect(store.stats.reputation).toBe(100)
      store.applyStatDelta({ reputation: -999 })
      expect(store.stats.reputation).toBe(0)
    })

    it('clamps fatigue between 0 and 100', () => {
      const store = useGameStore()
      store.applyStatDelta({ fatigue: 999 })
      expect(store.stats.fatigue).toBe(100)
    })

    it('does not allow cash below zero', () => {
      const store = useGameStore()
      store.applyStatDelta({ cash: -99999 })
      expect(store.stats.cash).toBe(0)
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

  describe('advanceTurn', () => {
    it('increments turn counter', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.advanceTurn()
      expect(store.turn).toBe(2)
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
      store.advanceTurn()
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
