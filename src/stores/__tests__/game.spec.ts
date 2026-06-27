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

    it('floors fatigue at 0 but has no upper cap (0014 it-05: overflow intencional)', () => {
      const store = useGameStore()
      store.applyStatDelta({ fatigue: 130 })
      expect(store.stats.fatigue).toBe(130) // passa de 100 — overflow permitido
      store.applyStatDelta({ fatigue: -999 })
      expect(store.stats.fatigue).toBe(0) // piso 0 mantido
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
      expect(store.availableSongs).toHaveLength(0)
      store.advanceToNextCompletion() // salta o restante até concluir
      expect(store.activeActions).toHaveLength(0)
      expect(store.availableSongs).toHaveLength(1)
    })

    it('compose creates a first-class Song with inherited genre and quality (0015)', () => {
      const store = freshGame() // genre 'Rock'
      store.startAction('compose')
      store.advanceToNextCompletion()
      const song = store.songs[0]
      expect(song).toBeDefined()
      expect(song!.name.length).toBeGreaterThan(0)
      expect(song!.theme.length).toBeGreaterThan(0)
      expect(song!.genre).toBe('Rock')
      expect(song!.quality).toBeGreaterThanOrEqual(1)
      expect(song!.quality).toBeLessThanOrEqual(100)
      expect(song!.status).toBe('composed')
      // a mensagem do evento nomeia a música
      expect(store.recentEvents[0]?.message).toContain(song!.name)
    })

    it('recording marks the song as released (kept in inventory) (0015)', () => {
      const store = freshGame()
      store.startAction('compose')
      store.advanceToNextCompletion()
      expect(store.availableSongs).toHaveLength(1)
      const rec = store.startAction('record-single') // requer 1 música
      expect(rec.ok).toBe(true)
      expect(store.availableSongs).toHaveLength(0) // não está mais disponível
      expect(store.songs).toHaveLength(1) // mas segue no inventário
      expect(store.songs[0]?.status).toBe('released')
    })

    // Helpers da cadeia de lançamento (feature 0015, slice 3).
    function composeSongs(store: ReturnType<typeof freshGame>, n: number) {
      for (let i = 0; i < n; i++) {
        store.startAction('compose')
        store.advanceToNextCompletion()
      }
    }
    function recordSingle(store: ReturnType<typeof freshGame>) {
      store.startAction('record-single')
      store.advanceToNextCompletion()
    }

    it('record-single creates a single Release referencing the song (0015 slice 3)', () => {
      const store = freshGame()
      composeSongs(store, 1)
      const songName = store.songs[0]!.name
      recordSingle(store)
      expect(store.releases).toHaveLength(1)
      const single = store.releases[0]!
      expect(single.type).toBe('single')
      expect(single.title).toBe(songName) // single herda o nome da faixa
      expect(single.trackIds).toEqual([store.songs[0]!.id])
      expect(store.availableSingles).toHaveLength(1)
    })

    it('album requires 2 singles + 4 songs and absorbs the singles (0015 slice 3)', () => {
      const store = freshGame()
      store.applyStatDelta({ cash: 100000 }) // isola o teste da economia (evita falência)
      // sem singles nem músicas: bloqueado
      expect(store.canStartAction('record-album').ok).toBe(false)

      // dois singles (2 músicas compostas + gravadas)
      composeSongs(store, 1)
      recordSingle(store)
      composeSongs(store, 1)
      recordSingle(store)
      expect(store.availableSingles).toHaveLength(2)

      // ainda faltam as 4 músicas novas do álbum
      expect(store.canStartAction('record-album').ok).toBe(false)
      composeSongs(store, 4)
      expect(store.canStartAction('record-album').ok).toBe(true)

      store.startAction('record-album')
      store.advanceToNextCompletion()

      const album = store.releases.find((r) => r.type === 'album')!
      expect(album).toBeDefined()
      // 2 faixas dos singles + 4 músicas novas = 6
      expect(album.trackIds).toHaveLength(6)
      // os singles foram absorvidos → não mais disponíveis para outro álbum
      expect(store.availableSingles).toHaveLength(0)
    })

    it('blocks recording when there are not enough songs', () => {
      const store = freshGame()
      const rec = store.startAction('record-album') // requer 3 músicas
      expect(rec.ok).toBe(false)
    })

    it('records the explicitly selected song, not the oldest (0015 D6)', () => {
      const store = freshGame()
      composeSongs(store, 2) // duas músicas: a 1ª é a mais antiga
      const newest = store.songs[1]!
      // seleciona explicitamente a 2ª música (a que o auto-pick NÃO escolheria)
      const rec = store.startAction('record-single', undefined, { songIds: [newest.id] })
      expect(rec.ok).toBe(true)
      store.advanceToNextCompletion()
      const single = store.releases.find((r) => r.type === 'single')!
      expect(single.trackIds).toEqual([newest.id])
      // a 1ª música segue disponível (não foi consumida)
      expect(store.availableSongs).toHaveLength(1)
      expect(store.availableSongs[0]!.id).toBe(store.songs[0]!.id)
    })

    it('rejects a selection whose count does not match the requirement (0015 D6)', () => {
      const store = freshGame()
      composeSongs(store, 2)
      const ids = store.songs.map((s) => s.id)
      const rec = store.startAction('record-single', undefined, { songIds: ids }) // 2 p/ 1 vaga
      expect(rec.ok).toBe(false)
      expect(store.activeActions).toHaveLength(0)
      // nenhuma música foi consumida
      expect(store.availableSongs).toHaveLength(2)
    })

    it('edits song metadata and renames a release (0015 D7)', () => {
      const store = freshGame()
      composeSongs(store, 1)
      const songId = store.songs[0]!.id
      store.editSong(songId, { name: 'Minha Canção', genre: 'Punk', theme: 'Rebeldia' })
      expect(store.songs[0]!.name).toBe('Minha Canção')
      expect(store.songs[0]!.genre).toBe('Punk')
      expect(store.songs[0]!.theme).toBe('Rebeldia')
      // campos vazios são ignorados
      store.editSong(songId, { name: '   ' })
      expect(store.songs[0]!.name).toBe('Minha Canção')

      recordSingle(store)
      const single = store.releases[0]!
      store.renameRelease(single.id, 'Hit do Verão')
      expect(store.releases[0]!.title).toBe('Hit do Verão')
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
      store.advanceToNextCompletion() // 5 dias × -6/dia (sem passivo durante ação main)
      expect(store.stats.fatigue).toBe(60) // 90 - 30
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
      expect(store.songs).toHaveLength(0)
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

    it('completion events report the applied effects as chips (Playtest 02)', () => {
      const store = freshGame()
      store.startAction('play-show')
      store.advanceToNextCompletion()
      const effects = store.recentEvents[0]?.effects ?? []
      expect(effects.some((e) => e.label.includes('fãs') && e.tone === 'pos')).toBe(true)
      expect(effects.some((e) => e.label.includes('R$'))).toBe(true)
      // A fadiga acumula por dia (0014 it-04), mas o evento ainda reporta o total da ação
      // como chip negativo (Playtest 04 imediato): show = 18/dia × 1 dia = +18.
      expect(effects.some((e) => e.label.includes('fadiga') && e.tone === 'neg')).toBe(true)
    })
  })

  describe('fatigue model — per-day (0014 it-04, Playtest 04 pontos 2 e 6)', () => {
    function freshGame() {
      const store = useGameStore()
      store.setRandomSource(() => 0.5)
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      return store
    }

    it('a longer tour fatigues more than a shorter one (proporcional à duração)', () => {
      const store = freshGame()
      store.applyStatDelta({ reputation: 30 })
      store.startAction('tour', 'Mini-turnê') // 14 dias × 2/dia = +28
      store.advanceToNextCompletion()
      const miniFatigue = store.stats.fatigue
      expect(miniFatigue).toBe(28)

      // novo jogo: zera o estado (mesma instância de store no Pinia de teste)
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.applyStatDelta({ reputation: 30 })
      store.startAction('tour', 'Turnê nacional') // 45 dias × 2/dia = +90
      store.advanceToNextCompletion()
      const nationalFatigue = store.stats.fatigue
      expect(nationalFatigue).toBe(90)

      expect(nationalFatigue).toBeGreaterThan(miniFatigue)
    })

    it('recording an album increases fatigue (não zera) — bug do Playtest 04 ponto 6', () => {
      const store = freshGame()
      // monta os insumos do álbum (2 singles + 4 músicas) sem mexer na fadiga à mão
      for (let i = 0; i < 6; i++) {
        store.startAction('compose')
        store.advanceToNextCompletion()
      }
      store.startAction('record-single')
      store.advanceToNextCompletion()
      store.startAction('record-single')
      store.advanceToNextCompletion()
      const before = store.stats.fatigue
      store.startAction('record-album') // 35 dias × 1.5/dia ≈ +53, sem recuperação passiva
      store.advanceToNextCompletion()
      expect(store.stats.fatigue).toBeGreaterThan(before)
    })

    it('does not apply passive recovery while a main action is in progress', () => {
      const store = freshGame()
      store.applyStatDelta({ reputation: 30, fatigue: 10 })
      store.startAction('tour', 'Mini-turnê') // 14 dias: só +28 da turnê, sem -14 passivo
      store.advanceToNextCompletion()
      expect(store.stats.fatigue).toBe(38) // 10 + 28 (sem recuperação passiva)
    })

    it('reports the action fatigue cost/recovery as a chip (Playtest 04 imediato)', () => {
      const store = freshGame()
      store.applyStatDelta({ fatigue: 50 })
      store.startAction('rest')
      store.advanceToNextCompletion() // descanso: -6/dia × 5 = -30
      const effects = store.recentEvents[0]?.effects ?? []
      // recuperação aparece como chip positivo de fadiga ("-30 fadiga", tom pos)
      expect(effects.some((e) => e.label.includes('fadiga') && e.tone === 'pos')).toBe(true)
    })

    it('overexertion (>100) reduces gains and costs reputation (0014 it-05)', () => {
      const store = freshGame()
      // baseline: turnê concluída sem estourar o teto (fadiga 0 → 90)
      store.applyStatDelta({ reputation: 30 })
      store.startAction('tour', 'Turnê nacional')
      store.advanceToNextCompletion()
      expect(store.stats.fatigue).toBe(90) // < 100, sem penalidade
      const baseRep = store.stats.reputation
      const baseFans = store.stats.fans

      // mesma turnê começando perto do limite → conclui acima de 100 (estouro)
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.applyStatDelta({ reputation: 30, fatigue: 70 }) // 70 < 80 (pode iniciar)
      store.startAction('tour', 'Turnê nacional')
      store.advanceToNextCompletion()
      expect(store.stats.fatigue).toBe(160) // 70 + 90, sem teto

      // ganhos reduzidos + golpe de reputação → ambos menores que o baseline
      expect(store.stats.fans).toBeLessThan(baseFans)
      expect(store.stats.reputation).toBeLessThan(baseRep)
      // o acontecimento sinaliza o desgaste
      expect(store.recentEvents[0]?.message).toContain('passou do limite')
    })
  })

  describe('Playtest 04 leva (gênero na composição, descarte, cachê ∝ reputação)', () => {
    function freshGame() {
      const store = useGameStore()
      store.setRandomSource(() => 0.5)
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      return store
    }

    it('compose aplica o gênero e tema escolhidos (ponto 1.1)', () => {
      const store = freshGame()
      store.startAction('compose', undefined, { genre: 'Punk', theme: 'Rebeldia' })
      store.advanceToNextCompletion()
      const song = store.songs[0]!
      expect(song.genre).toBe('Punk')
      expect(song.theme).toBe('Rebeldia')
    })

    it('compose sem escolha autogera o metadado (gênero herdado da banda)', () => {
      const store = freshGame()
      store.startAction('compose')
      store.advanceToNextCompletion()
      expect(store.songs[0]!.genre).toBe('Rock') // herdado
    })

    it('descarta uma música pronta, mas não uma já lançada (ponto 5)', () => {
      const store = freshGame()
      store.startAction('compose')
      store.advanceToNextCompletion()
      const id = store.songs[0]!.id
      expect(store.discardSong(id)).toBe(true)
      expect(store.songs).toHaveLength(0)

      // grava uma demo (3 músicas viram released) e tenta descartar uma lançada
      for (let i = 0; i < 3; i++) {
        store.startAction('compose')
        store.advanceToNextCompletion()
      }
      store.startAction('record-demo')
      store.advanceToNextCompletion()
      const released = store.songs.find((s) => s.status === 'released')!
      expect(store.discardSong(released.id)).toBe(false)
      expect(store.songs.some((s) => s.id === released.id)).toBe(true)
    })

    it('cachê de show escala com a reputação (ponto 4)', () => {
      const store = freshGame()
      const cash0 = store.stats.cash
      store.startAction('play-show')
      store.advanceToNextCompletion()
      const gainLowRep = store.stats.cash - cash0

      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      store.applyStatDelta({ reputation: 100 })
      const cashBefore = store.stats.cash
      store.startAction('play-show')
      store.advanceToNextCompletion()
      const gainHighRep = store.stats.cash - cashBefore

      expect(gainHighRep).toBeGreaterThan(gainLowRep)
    })
  })

  describe('royalties (feature 0015, slice 4 / D4)', () => {
    function freshGame() {
      const store = useGameStore()
      store.setRandomSource(() => 0.5)
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      return store
    }
    function composeSongs(store: ReturnType<typeof freshGame>, n: number) {
      for (let i = 0; i < n; i++) {
        store.startAction('compose')
        store.advanceToNextCompletion()
      }
    }
    function releaseSingle(store: ReturnType<typeof freshGame>) {
      composeSongs(store, 1)
      store.startAction('record-single')
      store.advanceToNextCompletion()
      return store.releases.find((r) => r.type === 'single')!
    }

    it('a released single seeds a positive per-turn royalty scaled by fans', () => {
      const store = freshGame()
      store.applyStatDelta({ fans: 300 })
      const single = releaseSingle(store)
      expect(single.currentRoyalty).toBeGreaterThan(0)
      expect(single.fanBaseAtRelease).toBeGreaterThanOrEqual(300)
      expect(single.totalRoyaltiesEarned).toBe(0)
      expect(store.royaltyIncomePerTurn).toBe(Math.round(single.currentRoyalty))
    })

    it('accrues royalties into cash over time and decays the per-turn royalty', () => {
      const store = freshGame()
      store.applyStatDelta({ fans: 1000 })
      const single = releaseSingle(store)
      single.currentRoyalty = 100 // controla o valor para previsibilidade
      const cashBefore = store.stats.cash
      store.advanceDays(1) // paga 100 (decay single 0.96 → próximo 96)
      expect(store.stats.cash).toBe(cashBefore + 100)
      expect(store.royaltiesEarnedTotal).toBe(100)
      expect(single.currentRoyalty).toBeCloseTo(96)
      expect(single.totalRoyaltiesEarned).toBeCloseTo(100)
    })

    it('demo earns no royalty (career step, not income)', () => {
      const store = freshGame()
      store.applyStatDelta({ fans: 500 })
      composeSongs(store, 3)
      store.startAction('record-demo')
      store.advanceToNextCompletion()
      const demo = store.releases.find((r) => r.type === 'demo')!
      expect(demo.currentRoyalty).toBe(0)
    })

    it('reports the accumulated royalties as a monthly event', () => {
      const store = freshGame()
      store.applyStatDelta({ fans: 2000 })
      const single = releaseSingle(store)
      single.currentRoyalty = 100
      store.advanceDays(60) // cruza ao menos uma virada de mês
      const ev = store.recentEvents.find((e) => e.message === 'Royalties recebidos.')
      expect(ev).toBeDefined()
      expect(ev!.effects?.[0]?.tone).toBe('pos')
    })

    it('resetGame clears the royalty total', () => {
      const store = freshGame()
      store.applyStatDelta({ fans: 1000 })
      const single = releaseSingle(store)
      single.currentRoyalty = 50
      store.advanceDays(1)
      expect(store.royaltiesEarnedTotal).toBeGreaterThan(0)
      store.resetGame()
      expect(store.royaltiesEarnedTotal).toBe(0)
    })
  })

  describe('session modes & outcomes (0010)', () => {
    function freshGame(durationYears = 10) {
      const store = useGameStore()
      store.setRandomSource(() => 0.5)
      store.startGame({
        bandName: 'B',
        genre: 'Rock',
        originTrait: 'Garagem',
        sessionMode: 'timed',
        durationYears,
      })
      return store
    }

    it('stores the chosen session config and defaults to timed/10', () => {
      const store = useGameStore()
      store.startGame({ bandName: 'B', genre: 'Rock', originTrait: 'Garagem' })
      expect(store.sessionMode).toBe('timed')
      expect(store.durationYears).toBe(10)
      expect(store.endTurn).toBe(3600) // 10 anos × 360 dias
      expect(store.outcome).toBeNull()
    })

    it('ends a timed session with a star rating when the time is up', () => {
      const store = freshGame(10)
      store.applyStatDelta({ cash: 100_000 }) // solvente, para não falir antes
      store.advanceDays(3600) // chega ao fim dos 10 anos
      expect(store.currentView).toBe('result')
      expect(store.outcome?.type).toBe('success')
      expect(store.outcome?.stars).toBeGreaterThanOrEqual(1)
      expect(store.outcome?.stars).toBeLessThanOrEqual(5)
    })

    it('ends in defeat by bankruptcy after sustained negative cash', () => {
      const store = freshGame(10)
      store.advanceDays(120) // 4 meses de custos sem receita -> caixa no vermelho
      expect(store.stats.cash).toBeLessThan(0)
      expect(store.currentView).toBe('result')
      expect(store.outcome?.type).toBe('defeat')
      expect(store.outcome?.reason).toBe('Falência')
    })

    it('does not advance time after the session has ended', () => {
      const store = freshGame(10)
      store.advanceDays(120) // termina em falência
      const turnAtEnd = store.turn
      store.advanceDays(30)
      expect(store.turn).toBe(turnAtEnd)
    })

    it('free mode has no scheduled end', () => {
      const store = useGameStore()
      store.startGame({
        bandName: 'B',
        genre: 'Rock',
        originTrait: 'Garagem',
        sessionMode: 'free',
        durationYears: 0,
      })
      store.applyStatDelta({ cash: 100_000 })
      store.advanceDays(4000)
      expect(store.endTurn).toBe(0)
      expect(store.currentView).toBe('game')
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
