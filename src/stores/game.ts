import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createDefaultRoster, type BandMember } from '@/data/cast'
import { getAction, resolveEffort, resolveOutcome, type ActionLane } from '@/data/actions'
import { createSong, type Song } from '@/data/songs'
import { createRelease, accrueRoyalty, ROYALTY_PROFILE, type Release } from '@/data/releases'
import {
  VENUES,
  isVenueUnlocked,
  missingRequirement,
  computeShowResult,
  getVenue,
  venueStaffShortfall,
  venueStaffSatisfied,
} from '@/data/venues'
import { getStaffRole, staffCountsByRole, type StaffMember, type StaffRole } from '@/data/staff'
import {
  computeScore,
  computeStars,
  type SessionMode,
  type SessionOutcome,
} from '@/data/session'

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

// Efeito reportado num evento, renderizado como chip (design-system: .tag pos/neg).
export interface EventEffect {
  label: string
  tone: 'pos' | 'neg'
}

export interface GameEvent {
  id: string
  turn: number
  category: EventCategory
  message: string
  effects?: EventEffect[]
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
  // Insumos reservados ao iniciar, para compor o lançamento ao concluir (feature 0015).
  consumedSongIds?: string[]
  consumedSingleIds?: string[]
  // Gênero/tema escolhidos ao compor (Playtest 04 ponto 1.1), aplicados na conclusão.
  composeGenre?: string
  composeTheme?: string
}

// Show agendado num local para uma data futura (feature 0016 slice 2 / D4).
export interface ScheduledShow {
  id: string
  venueId: string
  turnDue: number // turno (dia absoluto) em que o show acontece
}

const INITIAL_STATS: BandStats = {
  reputation: 0, // começa em 0; sem teto superior (Playtest 02, ponto 1)
  cash: 500,
  fans: 0,
  fatigue: 0,
}

// Turno = dia (0008 it-02 / 0003 it-04). Calendário regular: 12 meses × 30 dias.
export const DAYS_PER_MONTH = 30
export const MONTHS_PER_YEAR = 12
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR // 360

// O jogo começa no Brasil dos anos 2000 (Playtest 02, ponto 7).
export const START_YEAR = 2000

// Recuperação passiva de fadiga por dia avançado (Playtest 02, ponto 8).
const PASSIVE_FATIGUE_RECOVERY_PER_DAY = 1

// Excesso de fadiga (0014 it-05): a fadiga não tem teto superior; passar de 100 (o
// "soft cap") ao concluir uma ação a penaliza. Números = placeholders de balance (0003).
const FATIGUE_SOFT_CAP = 100
const OVEREXERTION_GAIN_PENALTY_PER_POINT = 0.01 // -1% dos ganhos por ponto acima de 100
const OVEREXERTION_GAIN_PENALTY_MAX = 0.5 // teto de -50% nos ganhos
const OVEREXERTION_REP_PENALTY_PER_POINT = 0.1 // -0.1 de reputação por ponto acima de 100

// Derrota por falência: caixa negativo por este número de dias consecutivos (0010).
const BANKRUPTCY_DAYS = 90

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

// Balance pass 1 (0003 iteration-05) — placeholders a afinar jogando.
export const MEMBER_BASE_MONTHLY_COST = 100 // R$ por membro/mês (× fator de reputação)
const REP_GRACE_DAYS = 30 // dias de inatividade pública antes de a reputação cair
const REP_DECAY_EVERY = 10 // após a carência, perde 1 de reputação a cada N dias inativos
// Cachê escala com reputação (0014 it-06): multiplicador = 1 + reputação × fator.
// Ex.: 0.01 → reputação 50 paga +50% de cachê; reputação 100, +100%. Placeholder (0003).
const REP_CASH_FACTOR = 0.01

// Ações voltadas ao público — zeram a inatividade (evitam decay de reputação).
// (Shows agora são agendados por local — ver scheduledShows; eles também zeram a inatividade.)
const PUBLIC_ACTION_IDS = new Set(['tour', 'record-demo', 'record-single', 'record-album', 'marketing'])

// Fadiga do dia do show (0016 slice 2) — o gig cansa; aplicada na data, como evento pontual.
const SHOW_FATIGUE = 18

// Balance da turnê (Playtest 05 ponto 9): cachê = (garantia + fãs × por-fã) × esforço × reput.
// A turnê toca para a base de fãs em várias praças → escala com fãs. Placeholders (0003).
const TOUR_GUARANTEE = 1500
const TOUR_CASH_PER_FAN = 30

export interface StartActionResult {
  ok: boolean
  reason?: string
}

// Seleção explícita de insumos ao gravar (feature 0015, D6). Sem ela, auto-pick.
export interface ActionSelection {
  songIds?: string[]
  singleIds?: string[]
  // Escolha de gênero/tema ao compor (0015, Playtest 04 ponto 1.1). Ausente = autogerado.
  genre?: string
  theme?: string
}

export interface CalendarDate {
  year: number
  month: number
  monthName: string
  day: number
  displayYear: number
}

// Converte um turno (dia) em data de calendário. Antes de começar (turn < 1): ano 1, dia 0.
export function computeCalendar(turn: number): CalendarDate {
  if (turn < 1) {
    return { year: 1, month: 1, monthName: MONTH_NAMES[0], day: 0, displayYear: START_YEAR }
  }
  const zero = turn - 1
  const dayOfYear = zero % DAYS_PER_YEAR
  const month = Math.floor(dayOfYear / DAYS_PER_MONTH) + 1
  const year = Math.floor(zero / DAYS_PER_YEAR) + 1
  return {
    year,
    month,
    monthName: MONTH_NAMES[month - 1] ?? MONTH_NAMES[0],
    day: (dayOfYear % DAYS_PER_MONTH) + 1,
    displayYear: START_YEAR + year - 1,
  }
}

export const useGameStore = defineStore('game', () => {
  const bandName = ref('')
  const genre = ref('')
  const originTrait = ref('')
  const turn = ref(0)
  const currentView = ref<'start' | 'game' | 'result'>('start')
  // Configuração e desfecho da sessão (feature 0010).
  const sessionMode = ref<SessionMode>('timed')
  const durationYears = ref(10)
  const outcome = ref<SessionOutcome | null>(null)
  let negativeCashStreak = 0

  const stats = ref<BandStats>({ ...INITIAL_STATS })
  const members = ref<BandMember[]>([])
  const events = ref<GameEvent[]>([])
  // Inventário de músicas (feature 0015): substitui o antigo contador inteiro.
  const songs = ref<Song[]>([])
  // Lançamentos: demo/single/álbum (feature 0015, slice 3).
  const releases = ref<Release[]>([])
  const activeActions = ref<ActiveAction[]>([])
  // Shows agendados por local (feature 0016 slice 2): compromisso datado que dispara na data.
  const scheduledShows = ref<ScheduledShow[]>([])
  // Equipe contratada (feature 0013): salário mensal + gate de locais.
  const hiredStaff = ref<StaffMember[]>([])
  // Dias desde a última atividade pública (para o decay de reputação).
  const inactiveDays = ref(0)
  // Total de royalties recebidos na sessão (receita de longo prazo — slice 4 / D4).
  const royaltiesEarnedTotal = ref(0)

  let eventSeq = 0
  let songSeq = 0
  let releaseSeq = 0
  let showSeq = 0
  let staffSeq = 0
  // Resíduo fracionário de royalty: mantém o caixa inteiro creditando só a parte inteira.
  let royaltyResidual = 0
  // Royalty acumulado desde o último relatório mensal (creditado no caixa; flush no evento).
  let pendingRoyalty = 0
  // Fonte de aleatoriedade injetável (determinismo em testes).
  let randomFn: () => number = Math.random

  // Músicas ainda não lançadas — insumo das ações de gravação (feature 0015).
  const availableSongs = computed(() => songs.value.filter((s) => s.status === 'composed'))
  // Singles ainda não absorvidos por um álbum — insumo do álbum (feature 0015, slice 3).
  const availableSingles = computed(() =>
    releases.value.filter((r) => r.type === 'single' && !r.consumedByAlbumId),
  )
  const songById = (id: string) => songs.value.find((s) => s.id === id)

  // Contagem de equipe por papel (0013) — base do gate de locais e do custo mensal.
  const staffCounts = computed(() => staffCountsByRole(hiredStaff.value))

  // Catálogo de locais: desbloqueio por reputação+fãs (0016 slice 1) + gate de equipe (0013).
  const venueCatalog = computed(() =>
    VENUES.map((venue) => {
      const stat = { reputation: stats.value.reputation, fans: stats.value.fans }
      const unlocked = isVenueUnlocked(venue, stat)
      const staffShortfall = venueStaffShortfall(venue, staffCounts.value)
      const staffOk = staffShortfall.length === 0
      return {
        venue,
        unlocked,
        missing: missingRequirement(venue, stat),
        staffShortfall,
        staffOk,
        bookable: unlocked && staffOk, // pode agendar: desbloqueado E com a equipe exigida
      }
    }),
  )

  const isGameStarted = computed(() => currentView.value === 'game')
  const isFatigued = computed(() => stats.value.fatigue >= 80)

  // Eventos mais recentes primeiro, para renderização direta na timeline.
  const recentEvents = computed(() => [...events.value].reverse())

  // Calendário derivado do turno atual (dia).
  const calendar = computed(() => computeCalendar(turn.value))
  // Data de calendário de um turno arbitrário (ex.: data de um lançamento — feature 0015).
  const calendarAt = (t: number) => computeCalendar(t)

  const activeMainAction = computed(
    () => activeActions.value.find((a) => a.lane === 'main') ?? null,
  )
  const canStartMain = computed(() => !activeMainAction.value && !isFatigued.value)

  // Dias até a próxima conclusão de ação (1 se não houver ações ativas).
  const nextCompletionDays = computed(() => {
    // próximo evento = menor entre conclusões de ação e shows agendados (0016 slice 2)
    const days = [
      ...activeActions.value.map((a) => a.turnsRemaining),
      ...scheduledShows.value.map((s) => s.turnDue - turn.value),
    ].filter((d) => d > 0)
    return days.length ? Math.min(...days) : 1
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

  // Custo mensal total da banda: por membro, crescendo com a reputação (0003 it-05).
  const monthlyMemberCost = computed(() =>
    Math.round(members.value.length * MEMBER_BASE_MONTHLY_COST * (1 + stats.value.reputation / 100)),
  )

  // Salário mensal da equipe contratada (feature 0013): soma dos salários dos papéis.
  const monthlyStaffCost = computed(() =>
    hiredStaff.value.reduce((sum, m) => sum + getStaffRole(m.role).monthlySalary, 0),
  )

  // Royalty pago no próximo turno (soma dos lançamentos ativos) — receita por dia (D4).
  const royaltyIncomePerTurn = computed(() =>
    Math.round(releases.value.reduce((sum, r) => sum + (r.currentRoyalty ?? 0), 0)),
  )

  function startGame(payload: {
    bandName: string
    genre: string
    originTrait: string
    sessionMode?: SessionMode
    durationYears?: number
  }) {
    bandName.value = payload.bandName
    genre.value = payload.genre
    originTrait.value = payload.originTrait
    sessionMode.value = payload.sessionMode ?? 'timed'
    durationYears.value = payload.durationYears ?? 10
    outcome.value = null
    negativeCashStreak = 0
    stats.value = { ...INITIAL_STATS }
    members.value = createDefaultRoster()
    events.value = []
    songs.value = []
    releases.value = []
    activeActions.value = []
    scheduledShows.value = []
    hiredStaff.value = []
    inactiveDays.value = 0
    royaltiesEarnedTotal.value = 0
    eventSeq = 0
    songSeq = 0
    releaseSeq = 0
    showSeq = 0
    staffSeq = 0
    royaltyResidual = 0
    pendingRoyalty = 0
    turn.value = 1
    currentView.value = 'game'
    logEvent('milestone', `${payload.bandName} foi formada. Boa sorte!`)
  }

  // Último turno (dia) de um modo temporizado. 0 = sem fim (modo livre).
  const endTurn = computed(() =>
    sessionMode.value === 'timed' ? durationYears.value * DAYS_PER_YEAR : 0,
  )

  function applyStatDelta(delta: Partial<BandStats>) {
    const s = stats.value
    // Reputação tem piso 0 e NÃO tem teto (Playtest 02, ponto 1).
    if (delta.reputation !== undefined) s.reputation = Math.max(0, s.reputation + delta.reputation)
    // Caixa pode ficar negativo (dívida) — feature 0003.
    if (delta.cash !== undefined) s.cash = s.cash + delta.cash
    if (delta.fans !== undefined) s.fans = Math.max(0, s.fans + delta.fans)
    // Fadiga: piso 0, SEM teto superior (0014 it-05) — o overflow acima de 100 é
    // intencional e penalizado na conclusão da ação (ver completeAction).
    if (delta.fatigue !== undefined) s.fatigue = Math.max(0, s.fatigue + delta.fatigue)
  }

  function logEvent(category: EventCategory, message: string, effects?: EventEffect[]) {
    events.value.push({
      id: String(++eventSeq),
      turn: turn.value,
      category,
      message,
      ...(effects && effects.length ? { effects } : {}),
    })
  }

  // Converte os deltas aplicados em chips de efeito (cor por "bom/ruim").
  function effectsFromDeltas(deltas: Partial<BandStats>): EventEffect[] {
    const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)
    const out: EventEffect[] = []
    if (deltas.cash)
      out.push({ label: `${deltas.cash > 0 ? '+' : '-'}R$ ${Math.abs(deltas.cash)}`, tone: deltas.cash > 0 ? 'pos' : 'neg' })
    if (deltas.fans) out.push({ label: `${signed(deltas.fans)} fãs`, tone: deltas.fans > 0 ? 'pos' : 'neg' })
    if (deltas.reputation)
      out.push({ label: `${signed(deltas.reputation)} reputação`, tone: deltas.reputation > 0 ? 'pos' : 'neg' })
    // fadiga: subir é ruim (neg), descansar/recuperar é bom (pos)
    if (deltas.fatigue) out.push({ label: `${signed(deltas.fatigue)} fadiga`, tone: deltas.fatigue > 0 ? 'neg' : 'pos' })
    return out
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
    if (req?.songs !== undefined && availableSongs.value.length < req.songs) {
      return { ok: false, reason: `Requer ${req.songs} música(s) pronta(s).` }
    }
    if (req?.singles !== undefined && availableSingles.value.length < req.singles) {
      return { ok: false, reason: `Requer ${req.singles} single(s) lançado(s).` }
    }
    // effortLabel é validado por resolveEffort (cai na primeira opção se inválido).
    void effortLabel
    return { ok: true }
  }

  function startAction(
    actionId: string,
    effortLabel?: string,
    selection?: ActionSelection,
  ): StartActionResult {
    const check = canStartAction(actionId, effortLabel)
    if (!check.ok) return check

    const action = getAction(actionId)
    const effort = resolveEffort(action, effortLabel)

    // Resolve as faixas/singles a consumir: por seleção explícita do jogador (D6) ou,
    // na ausência dela, auto-pick das mais antigas (compatibilidade).
    let songsToConsume: Song[] = []
    if (action.requires?.songs) {
      if (selection?.songIds) {
        const picked = selection.songIds
          .map((id) => availableSongs.value.find((s) => s.id === id))
          .filter((s): s is Song => s !== undefined)
        if (picked.length !== action.requires.songs) {
          return { ok: false, reason: `Selecione ${action.requires.songs} música(s) válida(s).` }
        }
        songsToConsume = picked
      } else {
        songsToConsume = availableSongs.value.slice(0, action.requires.songs)
      }
    }
    let singlesToConsume: Release[] = []
    if (action.requires?.singles) {
      if (selection?.singleIds) {
        const picked = selection.singleIds
          .map((id) => availableSingles.value.find((r) => r.id === id))
          .filter((r): r is Release => r !== undefined)
        if (picked.length !== action.requires.singles) {
          return { ok: false, reason: `Selecione ${action.requires.singles} single(s) válido(s).` }
        }
        singlesToConsume = picked
      } else {
        singlesToConsume = availableSingles.value.slice(0, action.requires.singles)
      }
    }

    // Reserva os insumos ao iniciar e guarda os ids para compor o lançamento ao concluir.
    // As músicas viram `released` já no início (mantidas no inventário — base p/ royalties/
    // discografia). Os singles só são marcados como absorvidos ao concluir o álbum.
    const consumedSongIds: string[] = []
    const consumedSingleIds: string[] = []
    for (const s of songsToConsume) {
      s.status = 'released'
      consumedSongIds.push(s.id)
    }
    for (const r of singlesToConsume) consumedSingleIds.push(r.id)

    activeActions.value.push({
      actionId: action.id,
      name: action.name,
      lane: action.lane,
      category: action.category,
      effortLabel: effort.label,
      turnsRemaining: effort.durationTurns,
      totalTurns: effort.durationTurns,
      ...(consumedSongIds.length ? { consumedSongIds } : {}),
      ...(consumedSingleIds.length ? { consumedSingleIds } : {}),
      ...(selection?.genre ? { composeGenre: selection.genre } : {}),
      ...(selection?.theme ? { composeTheme: selection.theme } : {}),
    })
    return { ok: true }
  }

  function completeAction(active: ActiveAction) {
    const action = getAction(active.actionId)
    const effort = resolveEffort(action, active.effortLabel)
    const deltas = resolveOutcome(action, effort, {
      rng: randomFn,
      qualityModifier: qualityModifier.value,
      reputationCashMultiplier: 1 + stats.value.reputation * REP_CASH_FACTOR,
    })
    // Balance da turnê (Playtest 05 ponto 9): a turnê toca para a base de FÃS em várias
    // praças, então o cachê escala com fãs (garantia + por-fã × esforço × reputação), em vez
    // de um valor fixo que o show com bilheteria sempre superava. Substitui o cash do catálogo.
    if (action.category === 'tour') {
      const repMult = 1 + stats.value.reputation * REP_CASH_FACTOR
      deltas.cash = Math.round(
        (TOUR_GUARANTEE + stats.value.fans * TOUR_CASH_PER_FAN) * effort.outcomeModifier * repMult,
      )
    }
    // Consequência do excesso de fadiga (0014 it-05): se a banda concluiu a ação acima
    // do soft cap (100), a performance é "no limite" — reduz os ganhos positivos e ainda
    // custa reputação, proporcional ao quanto passou. A fadiga já foi acumulada no avanço.
    const excess = Math.max(0, stats.value.fatigue - FATIGUE_SOFT_CAP)
    const overexerted = excess > 0
    if (overexerted) {
      const gainFactor =
        1 - Math.min(excess * OVEREXERTION_GAIN_PENALTY_PER_POINT, OVEREXERTION_GAIN_PENALTY_MAX)
      for (const key of ['cash', 'fans', 'reputation'] as const) {
        const v = deltas[key]
        if (v !== undefined && v > 0) deltas[key] = Math.round(v * gainFactor)
      }
      const repHit = Math.round(excess * OVEREXERTION_REP_PENALTY_PER_POINT)
      if (repHit > 0) deltas.reputation = (deltas.reputation ?? 0) - repHit
    }
    applyStatDelta(deltas as Partial<BandStats>)
    // Cria as músicas produzidas com metadado autogerado e qualidade (feature 0015).
    let message = completionMessage(active)
    if (action.produces?.songs) {
      let lastName = ''
      for (let i = 0; i < action.produces.songs; i++) {
        const song = createSong({
          id: String(++songSeq),
          genre: active.composeGenre ?? genre.value,
          ...(active.composeTheme ? { theme: active.composeTheme } : {}),
          bandQuality: bandQuality.value,
          effortModifier: effort.outcomeModifier,
          rng: randomFn,
        })
        songs.value.push(song)
        lastName = song.name
      }
      if (active.actionId === 'compose' && lastName) message = `"${lastName}" está pronta.`
    }
    // Cria o lançamento (demo/single/álbum) a partir dos insumos reservados (feature 0015).
    if (action.release) {
      const singlesAbsorbed = (active.consumedSingleIds ?? [])
        .map((id) => releases.value.find((r) => r.id === id))
        .filter((r): r is Release => r !== undefined)
      const tracks: Song[] = []
      // Faixas herdadas dos singles absorvidos (álbum) + músicas novas reservadas.
      for (const single of singlesAbsorbed) {
        for (const tid of single.trackIds) {
          const s = songById(tid)
          if (s) tracks.push(s)
        }
      }
      for (const sid of active.consumedSongIds ?? []) {
        const s = songById(sid)
        if (s) tracks.push(s)
      }
      const release = createRelease({
        id: String(++releaseSeq),
        type: action.release,
        releaseTurn: turn.value,
        tracks,
        fanBase: stats.value.fans,
        rng: randomFn,
      })
      for (const single of singlesAbsorbed) single.consumedByAlbumId = release.id
      releases.value.push(release)
      message =
        action.release === 'demo'
          ? 'Demo gravada — os primeiros fãs a caminho.'
          : `"${release.title}" foi lançado!`
    }
    // O evento reporta os efeitos aplicados como chips (Playtest 02, ponto 9). A fadiga
    // é acumulada por dia no avanço (0014 it-04), não vem em `deltas`; mas o acontecimento
    // ainda deve mostrar quanto a ação custou/recuperou de fadiga (Playtest 04 imediato) —
    // atribuímos o total da ação (taxa × duração) só para o chip, sem reaplicar ao estado.
    if (action.fatiguePerDay) {
      ;(deltas as Partial<BandStats>).fatigue = Math.round(action.fatiguePerDay * active.totalTurns)
    }
    // Flavor do excesso de fadiga (0014 it-05): os chips já mostram ganhos menores +
    // reputação negativa; a mensagem sinaliza o porquê.
    if (overexerted) message += ' A banda passou do limite — o desgaste cobrou seu preço.'
    logEvent(active.category, message, effectsFromDeltas(deltas))
  }

  function completionMessage(active: ActiveAction): string {
    switch (active.actionId) {
      case 'compose':
        return 'Uma nova música está pronta.'
      case 'rehearse':
        return 'A banda ensaiou e está mais afiada.'
      case 'rest':
        return 'A banda descansou e recuperou energia.'
      case 'tour':
        return 'A turnê terminou — exaustiva, mas valeu a pena.'
      case 'marketing':
        return 'A campanha de divulgação rendeu novos fãs.'
      default:
        return `${active.name} concluído(a).`
    }
  }

  // Quantas viradas de mês há entre dois turnos (dias).
  function monthsCrossed(oldTurn: number, newTurn: number): number {
    return Math.floor((newTurn - 1) / DAYS_PER_MONTH) - Math.floor((oldTurn - 1) / DAYS_PER_MONTH)
  }

  // Cobra os custos mensais (membros) por cada virada de mês cruzada no avanço.
  function chargeMonthlyCosts(oldTurn: number, newTurn: number) {
    for (let i = 0; i < monthsCrossed(oldTurn, newTurn); i++) {
      const cost = monthlyMemberCost.value + monthlyStaffCost.value // banda + equipe (0013)
      if (cost > 0) {
        applyStatDelta({ cash: -cost })
        logEvent('negotiation', 'Custos mensais da banda.', [
          { label: `-R$ ${cost}`, tone: 'neg' },
        ])
      }
    }
  }

  // Acumula os royalties de `days` turnos: cada lançamento ativo paga e decai (D4). O caixa
  // recebe só a parte inteira (o resíduo fracionário se acumula). Sem evento por turno — o
  // total é reportado uma vez por mês (flushRoyalties) para não inflar a timeline.
  function accrueRoyalties(days: number) {
    let revenue = 0
    for (const r of releases.value) {
      if (!r.currentRoyalty || r.currentRoyalty <= 0) continue
      const { revenue: rev, next } = accrueRoyalty(r.currentRoyalty, ROYALTY_PROFILE[r.type].decay, days)
      r.currentRoyalty = next
      r.totalRoyaltiesEarned += rev
      revenue += rev
    }
    if (revenue <= 0) return
    royaltyResidual += revenue
    const whole = Math.floor(royaltyResidual)
    if (whole <= 0) return
    royaltyResidual -= whole
    applyStatDelta({ cash: whole })
    royaltiesEarnedTotal.value += whole
    pendingRoyalty += whole
  }

  // Reporta os royalties acumulados como um único evento na virada de mês (par com os custos).
  function flushRoyalties(oldTurn: number, newTurn: number) {
    if (monthsCrossed(oldTurn, newTurn) > 0 && pendingRoyalty > 0) {
      logEvent('negotiation', 'Royalties recebidos.', [{ label: `+R$ ${pendingRoyalty}`, tone: 'pos' }])
      pendingRoyalty = 0
    }
  }

  // Decay de reputação por inatividade pública: após REP_GRACE_DAYS, perde 1 ponto
  // a cada REP_DECAY_EVERY dias inativos (0003 it-05).
  function applyReputationDecay(days: number) {
    const before = inactiveDays.value
    const after = before + days
    inactiveDays.value = after
    const unitsBefore = Math.max(0, Math.floor((before - REP_GRACE_DAYS) / REP_DECAY_EVERY))
    const unitsAfter = Math.max(0, Math.floor((after - REP_GRACE_DAYS) / REP_DECAY_EVERY))
    const decay = unitsAfter - unitsBefore
    if (decay > 0) applyStatDelta({ reputation: -decay })
  }

  function endSession(result: SessionOutcome) {
    outcome.value = result
    currentView.value = 'result'
  }

  // Checa derrota (falência) e fim por tempo (modo temporizado) após um avanço.
  function checkEndConditions(days: number) {
    if (currentView.value !== 'game') return
    // Falência: caixa negativo por BANKRUPTCY_DAYS dias consecutivos.
    if (stats.value.cash < 0) negativeCashStreak += days
    else negativeCashStreak = 0
    if (negativeCashStreak >= BANKRUPTCY_DAYS) {
      endSession({ type: 'defeat', reason: 'Falência' })
      return
    }
    // Fim por tempo (sucesso): nota em estrelas.
    if (endTurn.value > 0 && turn.value >= endTurn.value) {
      const score = computeScore(stats.value)
      endSession({ type: 'success', score, stars: computeStars(score, durationYears.value) })
    }
  }

  // Fadiga POR DIA do trecho avançado (0014 it-04): soma a taxa de cada ação ativa
  // (`fatiguePerDay`) durante os `days` dias. A recuperação passiva (Playtest 02, ponto 8)
  // só corre em dias OCIOSOS — sem nenhuma ação `main` em curso (tocar/gravar/turnê não
  // descansam de graça). `rest` recupera pela própria taxa negativa. Arredonda p/ inteiro.
  function applyFatigueForSpan(days: number) {
    let delta = 0
    let mainActive = false
    for (const a of activeActions.value) {
      const action = getAction(a.actionId)
      if (action.lane === 'main') mainActive = true
      if (action.fatiguePerDay) delta += action.fatiguePerDay * days
    }
    if (!mainActive) delta -= days * PASSIVE_FATIGUE_RECOVERY_PER_DAY
    delta = Math.round(delta)
    if (delta !== 0) applyStatDelta({ fatigue: delta })
  }

  // Avança `days` dias: cobra custos mensais, aplica decay, e conclui ações prontas.
  function advanceDays(days: number) {
    if (days <= 0 || currentView.value !== 'game') return
    const oldTurn = turn.value
    turn.value += days

    accrueRoyalties(days)
    chargeMonthlyCosts(oldTurn, turn.value)
    flushRoyalties(oldTurn, turn.value)
    applyReputationDecay(days)
    applyFatigueForSpan(days)

    const remaining: ActiveAction[] = []
    const completed: ActiveAction[] = []
    for (const a of activeActions.value) {
      a.turnsRemaining -= days
      if (a.turnsRemaining <= 0) completed.push(a)
      else remaining.push(a)
    }
    activeActions.value = remaining
    for (const a of completed) {
      completeAction(a)
      // atividade pública zera a inatividade (reputação volta a "contar")
      if (PUBLIC_ACTION_IDS.has(a.actionId)) inactiveDays.value = 0
    }

    fireScheduledShows()
    checkEndConditions(days)
  }

  // Dispara os shows agendados cuja data chegou (0016 slice 2 / D4): credita
  // cachê + bilheteria (computeShowResult), fãs e reputação, e cobra a fadiga do gig.
  function fireScheduledShows() {
    const due = scheduledShows.value.filter((s) => s.turnDue <= turn.value)
    if (due.length === 0) return
    scheduledShows.value = scheduledShows.value.filter((s) => s.turnDue > turn.value)
    for (const s of due) {
      const venue = getVenue(s.venueId)
      const result = computeShowResult(venue, {
        reputation: stats.value.reputation,
        fans: stats.value.fans,
        reputationCashMultiplier: 1 + stats.value.reputation * REP_CASH_FACTOR,
        rng: randomFn,
      })
      const deltas: Partial<BandStats> = {
        cash: result.cash,
        fans: result.fansGained,
        reputation: result.reputationGained,
        fatigue: SHOW_FATIGUE,
      }
      applyStatDelta(deltas)
      inactiveDays.value = 0 // show é atividade pública
      logEvent(
        'show',
        `Show em ${venue.name} — público de ${result.attendance.toLocaleString('pt-BR')}.`,
        effectsFromDeltas(deltas),
      )
    }
  }

  // Agenda um show num local desbloqueado para daqui a `leadDays` dias (0016 slice 2).
  // A turnê (0014) é o que libera agendar VÁRIOS shows de uma vez (Playtest 05 ponto 8).
  const canBookMultipleShows = computed(
    () => stats.value.reputation >= (getAction('tour').requires?.reputation ?? 30),
  )

  function scheduleShow(venueId: string, leadDays: number): StartActionResult {
    const venue = VENUES.find((v) => v.id === venueId)
    if (!venue) return { ok: false, reason: 'Local desconhecido.' }
    const stat = { reputation: stats.value.reputation, fans: stats.value.fans }
    if (!isVenueUnlocked(venue, stat)) {
      return { ok: false, reason: `Local travado. Requer ${missingRequirement(venue, stat)}.` }
    }
    // Gate de equipe (0013 slice 2 / Playtest 05 ponto 7): locais maiores exigem crew.
    if (!venueStaffSatisfied(venue, staffCounts.value)) {
      const falta = venueStaffShortfall(venue, staffCounts.value)
        .map((s) => `${s.need} ${getStaffRole(s.role).label.toLowerCase()}`)
        .join(' · ')
      return { ok: false, reason: `Falta equipe para esse local: ${falta}.` }
    }
    // 1 show por vez até a turnê liberar agendar vários (Playtest 05 ponto 8).
    if (!canBookMultipleShows.value && scheduledShows.value.length >= 1) {
      return { ok: false, reason: 'Só um show por vez até liberar a turnê.' }
    }
    const lead = Math.max(1, Math.round(leadDays))
    const turnDue = turn.value + lead
    // Um show por data — a banda não toca em dois lugares no mesmo dia (Playtest 05 ponto 6).
    if (scheduledShows.value.some((s) => s.turnDue === turnDue)) {
      return { ok: false, reason: 'Já há um show agendado para essa data.' }
    }
    scheduledShows.value.push({ id: String(++showSeq), venueId, turnDue })
    return { ok: true }
  }

  // Contrata um papel de staff (0013 slice 1): cobra o custo único na hora; o salário
  // mensal entra no custo da virada de mês. Caixa pode ficar negativo (dívida — 0003).
  function hireStaff(role: StaffRole): StartActionResult {
    const def = getStaffRole(role)
    hiredStaff.value.push({ id: String(++staffSeq), role })
    applyStatDelta({ cash: -def.hireCost })
    logEvent('negotiation', `Contratou: ${def.label}.`, [{ label: `-R$ ${def.hireCost}`, tone: 'neg' }])
    return { ok: true }
  }

  // Dispensa um membro da equipe (encerra o salário a partir do próximo mês).
  function fireStaff(id: string) {
    const member = hiredStaff.value.find((m) => m.id === id)
    if (!member) return
    hiredStaff.value = hiredStaff.value.filter((m) => m.id !== id)
    logEvent('negotiation', `Dispensou: ${getStaffRole(member.role).label}.`)
  }

  // Cancela uma ação em andamento ANTES de avançar o tempo (Playtest 06 ponto 2). Devolve
  // os insumos reservados (músicas voltam a 'composed'; singles só são marcados ao concluir).
  function cancelAction(actionId: string) {
    const idx = activeActions.value.findIndex((a) => a.actionId === actionId)
    if (idx < 0) return
    const a = activeActions.value[idx]!
    for (const sid of a.consumedSongIds ?? []) {
      const song = songById(sid)
      if (song) song.status = 'composed'
    }
    activeActions.value.splice(idx, 1)
  }

  // Cancela um show agendado (compromisso ainda não disparado).
  function cancelScheduledShow(id: string) {
    scheduledShows.value = scheduledShows.value.filter((s) => s.id !== id)
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
    songs.value = []
    releases.value = []
    activeActions.value = []
    scheduledShows.value = []
    hiredStaff.value = []
    inactiveDays.value = 0
    royaltiesEarnedTotal.value = 0
    outcome.value = null
    negativeCashStreak = 0
    eventSeq = 0
    songSeq = 0
    releaseSeq = 0
    showSeq = 0
    staffSeq = 0
    royaltyResidual = 0
    pendingRoyalty = 0
    turn.value = 0
    currentView.value = 'start'
  }

  // Edição de metadado (feature 0015, D7). Campos vazios/ausentes são ignorados.
  function editSong(id: string, patch: { name?: string; genre?: string; theme?: string }) {
    const song = songById(id)
    if (!song) return
    if (patch.name !== undefined && patch.name.trim()) song.name = patch.name.trim()
    if (patch.genre !== undefined && patch.genre.trim()) song.genre = patch.genre.trim()
    if (patch.theme !== undefined && patch.theme.trim()) song.theme = patch.theme.trim()
  }

  function renameRelease(id: string, title: string) {
    const release = releases.value.find((r) => r.id === id)
    if (release && title.trim()) release.title = title.trim()
  }

  // Descarta uma música ainda não lançada (Playtest 04 ponto 5). Música já lançada é
  // referenciada por um Release (discografia/royalties) e não pode ser removida.
  function discardSong(id: string): boolean {
    const song = songById(id)
    if (!song || song.status !== 'composed') return false
    songs.value = songs.value.filter((s) => s.id !== id)
    return true
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
    sessionMode,
    durationYears,
    outcome,
    endTurn,
    stats,
    members,
    events,
    songs,
    availableSongs,
    releases,
    availableSingles,
    venueCatalog,
    scheduledShows,
    scheduleShow,
    canBookMultipleShows,
    hiredStaff,
    staffCounts,
    monthlyStaffCost,
    hireStaff,
    fireStaff,
    cancelAction,
    cancelScheduledShow,
    activeActions,
    isGameStarted,
    isFatigued,
    recentEvents,
    calendar,
    calendarAt,
    activeMainAction,
    canStartMain,
    nextCompletionDays,
    bandQuality,
    qualityModifier,
    monthlyMemberCost,
    royaltyIncomePerTurn,
    royaltiesEarnedTotal,
    inactiveDays,
    startGame,
    applyStatDelta,
    logEvent,
    canStartAction,
    startAction,
    editSong,
    renameRelease,
    discardSong,
    advanceDays,
    advanceToNextCompletion,
    resetGame,
    setRandomSource,
  }
})
