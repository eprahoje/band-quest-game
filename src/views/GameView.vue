<template>
  <main class="game-view">
    <header class="game-view__header">
      <h1 class="game-view__band">{{ store.bandName }}</h1>
      <span class="turn-badge">
        {{ store.calendar.displayYear }} · {{ store.calendar.monthName }}, dia {{ store.calendar.day }}
      </span>
    </header>

    <StatsPanel />

    <section class="loop-bar" aria-label="Avançar o tempo">
      <span class="loop-bar__hint">O tempo avança pelas ações.</span>
      <button class="advance-btn" type="button" @click="advance">{{ advanceLabel }}</button>
    </section>

    <section v-if="selecting" class="track-picker" aria-label="Selecionar faixas">
      <header class="track-picker__head">
        <strong>{{ selecting.action.name }} · {{ selecting.effort.label }}</strong>
        <button class="track-picker__close" type="button" @click="cancelSelection">✕</button>
      </header>
      <p class="track-picker__hint">
        Escolha {{ requiredSongs }} música(s){{ requiredSingles ? ` e ${requiredSingles} single(s)` : '' }}.
      </p>

      <ul v-if="requiredSongs" class="picker-list">
        <li v-for="s in store.availableSongs" :key="s.id">
          <label class="picker-row">
            <input
              type="checkbox"
              :checked="selecting.songIds.includes(s.id)"
              :disabled="!selecting.songIds.includes(s.id) && selecting.songIds.length >= requiredSongs"
              @change="toggleSong(s.id)"
            />
            <span class="picker-row__name">{{ s.name }}</span>
            <span class="picker-row__meta">{{ s.genre }} · {{ s.theme }}</span>
            <span class="picker-row__q">Q {{ s.quality }}</span>
          </label>
        </li>
      </ul>

      <template v-if="requiredSingles">
        <p class="track-picker__sub">Singles a incluir no álbum:</p>
        <ul class="picker-list">
          <li v-for="r in store.availableSingles" :key="r.id">
            <label class="picker-row">
              <input
                type="checkbox"
                :checked="selecting.singleIds.includes(r.id)"
                :disabled="!selecting.singleIds.includes(r.id) && selecting.singleIds.length >= requiredSingles"
                @change="toggleSingle(r.id)"
              />
              <span class="picker-row__name">{{ r.title }}</span>
              <span class="picker-row__q">Q {{ r.quality }}</span>
            </label>
          </li>
        </ul>
      </template>

      <div class="track-picker__actions">
        <button class="picker-cancel" type="button" @click="cancelSelection">Cancelar</button>
        <button class="advance-btn" type="button" :disabled="!selectionComplete" @click="confirmSelection">
          Confirmar e gravar
        </button>
      </div>
    </section>

    <CollapsibleSection title="Custos" aria-label="Custos da banda">
      <ul class="costs__list">
        <li class="costs__item">
          <span>Membros (mensal)</span>
          <strong>R$ {{ store.monthlyMemberCost }}/mês</strong>
        </li>
        <li class="costs__item costs__item--muted">
          <span>Por ação (estúdio, gravação, marketing)</span>
          <span>ver cartões abaixo</span>
        </li>
        <li class="costs__item costs__item--muted">
          <span>Staff / estrutura</span>
          <span>em breve</span>
        </li>
      </ul>
    </CollapsibleSection>

    <CollapsibleSection
      title="Ganhos"
      aria-label="Ganhos da banda"
      :hint="store.royaltyIncomePerTurn ? `R$ ${store.royaltyIncomePerTurn}/dia` : ''"
    >
      <ul class="costs__list">
        <li class="costs__item">
          <span>Royalties (por dia)</span>
          <strong class="costs__pos">R$ {{ store.royaltyIncomePerTurn }}/dia</strong>
        </li>
        <li class="costs__item">
          <span>Royalties recebidos (total)</span>
          <strong class="costs__pos">R$ {{ store.royaltiesEarnedTotal }}</strong>
        </li>
        <li class="costs__item costs__item--muted">
          <span>Cachês de show, vendas</span>
          <span>ver cartões abaixo</span>
        </li>
      </ul>
    </CollapsibleSection>

    <CollapsibleSection title="Banda" aria-label="Membros da banda">
      <div class="roster__grid">
        <MemberCard v-for="m in store.members" :key="m.memberId" :member="m" />
      </div>
    </CollapsibleSection>

    <CollapsibleSection
      title="Em andamento"
      aria-label="Ações em andamento"
      :hint="store.activeActions.length ? `${store.activeActions.length} ativa(s)` : ''"
    >
      <p v-if="store.activeActions.length === 0" class="in-progress__empty">
        Nada em andamento. Escolha uma ação para o tempo avançar.
      </p>
      <ul v-else class="in-progress__list">
        <li v-for="a in store.activeActions" :key="a.actionId" class="progress-item">
          <span class="progress-item__name">{{ a.name }}</span>
          <span class="progress-item__effort">{{ a.effortLabel }}</span>
          <span class="progress-item__remaining">
            {{ a.turnsRemaining }}/{{ a.totalTurns }} dias
          </span>
        </li>
      </ul>
    </CollapsibleSection>

    <SongLibrary />

    <CollapsibleSection title="Ações" aria-label="Ações disponíveis">
      <div class="actions__grid">
        <article
          v-for="group in actionGroups"
          :key="group.action.id"
          class="action-card"
          :class="{ 'action-card--disabled': group.disabled }"
        >
          <header class="action-card__head">
            <span class="action-card__name">{{ group.action.name }}</span>
            <span v-if="group.action.lane === 'background'" class="action-card__tag">paralela</span>
          </header>
          <p class="action-card__desc">{{ group.action.description }}</p>
          <p v-if="group.cost || group.reqs.length" class="action-card__meta">
            <span v-if="group.cost">Custo base: R$ {{ group.cost }}</span>
            <span v-if="group.reqs.length">Requer: {{ group.reqs.join(' · ') }}</span>
          </p>
          <p v-if="group.disabled && group.reason" class="action-card__reason">{{ group.reason }}</p>
          <div class="action-card__efforts">
            <button
              v-for="effort in group.action.effortOptions"
              :key="effort.label"
              type="button"
              class="effort-btn"
              :disabled="group.disabled"
              @click="start(group.action, effort)"
            >
              <span class="effort-btn__label">{{ effort.label }} · {{ effort.durationTurns }} dias</span>
              <span
                v-if="fatigueCost(group.action, effort) !== 0"
                class="effort-btn__fatigue"
                :class="{ 'effort-btn__fatigue--warn': wouldOverexert(group.action, effort) }"
              >
                {{ fatigueText(group.action, effort) }}
              </span>
            </button>
          </div>
        </article>
      </div>
    </CollapsibleSection>

    <EventFeed />
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatsPanel from '@/components/StatsPanel.vue'
import EventFeed from '@/components/EventFeed.vue'
import MemberCard from '@/components/MemberCard.vue'
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import SongLibrary from '@/components/SongLibrary.vue'
import { useGameStore } from '@/stores/game'
import { ACTIONS, type ActionDef, type ActionEffortOption } from '@/data/actions'

const store = useGameStore()
const router = useRouter()

// Quando a sessão termina (vitória/derrota), vai para a tela de resultado (0010).
watch(
  () => store.currentView,
  (view) => {
    if (view === 'result') router.push('/result')
  },
)

const actionGroups = computed(() =>
  ACTIONS.map((action) => {
    const check = store.canStartAction(action.id)
    const baseCash = action.outcome.metrics.cash ?? 0
    const cost = baseCash < 0 ? -baseCash : 0
    const reqs: string[] = []
    if (action.requires?.songs) reqs.push(`${action.requires.songs} música(s)`)
    if (action.requires?.singles) reqs.push(`${action.requires.singles} single(s)`)
    if (action.requires?.reputation) reqs.push(`${action.requires.reputation} de reputação`)
    return { action, disabled: !check.ok, reason: check.reason, cost, reqs }
  }),
)

const advanceLabel = computed(() => {
  const days = store.nextCompletionDays
  if (store.activeActions.length === 0) return 'Avançar 1 dia ›'
  return `Avançar ${days} ${days === 1 ? 'dia' : 'dias'} ›`
})

// Seleção de faixas ao gravar (feature 0015, D6).
interface Selecting {
  action: ActionDef
  effort: ActionEffortOption
  songIds: string[]
  singleIds: string[]
}
const selecting = ref<Selecting | null>(null)
const requiredSongs = computed(() => selecting.value?.action.requires?.songs ?? 0)
const requiredSingles = computed(() => selecting.value?.action.requires?.singles ?? 0)
const selectionComplete = computed(
  () =>
    !!selecting.value &&
    selecting.value.songIds.length === requiredSongs.value &&
    selecting.value.singleIds.length === requiredSingles.value,
)

// Preview de fadiga no card (0014 it-05): custo = taxa por dia × duração da opção.
function fatigueCost(action: ActionDef, effort: ActionEffortOption): number {
  return action.fatiguePerDay ? Math.round(action.fatiguePerDay * effort.durationTurns) : 0
}
function wouldOverexert(action: ActionDef, effort: ActionEffortOption): boolean {
  const f = fatigueCost(action, effort)
  return f > 0 && store.stats.fatigue + f > 100
}
function fatigueText(action: ActionDef, effort: ActionEffortOption): string {
  const f = fatigueCost(action, effort)
  if (f === 0) return ''
  const base = f > 0 ? `+${f} fadiga` : `−${Math.abs(f)} fadiga`
  return wouldOverexert(action, effort) ? `⚠ ${base}` : base
}

function start(action: ActionDef, effort: ActionEffortOption) {
  // Gravações com requisito de músicas/singles passam pela seleção; demais iniciam direto.
  if (action.requires?.songs || action.requires?.singles) {
    selecting.value = { action, effort, songIds: [], singleIds: [] }
  } else {
    store.startAction(action.id, effort.label)
  }
}

function toggleSong(id: string) {
  if (!selecting.value) return
  const arr = selecting.value.songIds
  const i = arr.indexOf(id)
  if (i >= 0) arr.splice(i, 1)
  else if (arr.length < requiredSongs.value) arr.push(id)
}

function toggleSingle(id: string) {
  if (!selecting.value) return
  const arr = selecting.value.singleIds
  const i = arr.indexOf(id)
  if (i >= 0) arr.splice(i, 1)
  else if (arr.length < requiredSingles.value) arr.push(id)
}

function confirmSelection() {
  if (!selecting.value || !selectionComplete.value) return
  const { action, effort, songIds, singleIds } = selecting.value
  store.startAction(action.id, effort.label, {
    ...(songIds.length ? { songIds } : {}),
    ...(singleIds.length ? { singleIds } : {}),
  })
  selecting.value = null
}

function cancelSelection() {
  selecting.value = null
}

function advance() {
  store.advanceToNextCompletion()
}
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-5);
  padding: var(--bq-space-6);
  max-width: 960px;
  margin: 0 auto;
}

.game-view__header {
  display: flex;
  align-items: baseline;
  gap: var(--bq-space-4);
}

.game-view__band {
  font-size: var(--bq-text-2xl);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-display);
}

.turn-badge {
  font-size: var(--bq-text-xs);
  font-family: var(--bq-font-mono);
  color: var(--bq-spotlight);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  padding: var(--bq-space-1) var(--bq-space-3);
  border-radius: var(--bq-radius-pill);
  background: var(--bq-spotlight-dim);
}

.loop-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bq-space-4);
  padding: var(--bq-space-3) var(--bq-space-4);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-md);
}

.loop-bar__hint {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-faint);
}

/* Seletor de faixas ao gravar (feature 0015, D6). */
.track-picker {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-3);
  padding: var(--bq-space-4);
  background: var(--bq-bg-elevated);
  border: 1px solid var(--bq-spotlight);
  border-radius: var(--bq-radius-md);
}

.track-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.track-picker__close {
  background: none;
  border: none;
  color: var(--bq-text-muted);
  cursor: pointer;
  font-size: var(--bq-text-md);
}

.track-picker__hint,
.track-picker__sub {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-muted);
}

.picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-1);
  max-height: 260px;
  overflow-y: auto;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: var(--bq-space-3);
  padding: var(--bq-space-2) var(--bq-space-3);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-sm);
  font-size: var(--bq-text-sm);
  cursor: pointer;
}

.picker-row__name {
  font-weight: var(--bq-weight-semibold);
}

.picker-row__meta {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.picker-row__q {
  margin-left: auto;
  font-family: var(--bq-font-mono);
  font-size: var(--bq-text-xs);
  color: var(--bq-spotlight);
}

.track-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--bq-space-3);
}

.picker-cancel {
  padding: var(--bq-space-2) var(--bq-space-4);
  font-size: var(--bq-text-sm);
  color: var(--bq-text-muted);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-md);
  cursor: pointer;
}

.advance-btn {
  padding: var(--bq-space-2) var(--bq-space-5);
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  color: var(--bq-bg);
  background: var(--bq-spotlight);
  border: none;
  border-radius: var(--bq-radius-md);
  cursor: pointer;
  transition: filter var(--bq-dur-base) var(--bq-ease);
}

.advance-btn:hover {
  filter: brightness(1.08);
}

.advance-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-title {
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-muted);
  margin-bottom: var(--bq-space-3);
}

.costs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-1);
}

.costs__item {
  display: flex;
  justify-content: space-between;
  gap: var(--bq-space-4);
  padding: var(--bq-space-2) var(--bq-space-3);
  font-size: var(--bq-text-sm);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-sm);
}

.costs__item--muted {
  color: var(--bq-text-faint);
  font-size: var(--bq-text-xs);
}

.costs__pos {
  color: var(--bq-positive);
}

.action-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--bq-text-xs);
  color: var(--bq-text-faint);
}

.roster__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bq-space-4);
}

.in-progress__empty {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-faint);
}

.in-progress__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-2);
}

.progress-item {
  display: flex;
  align-items: center;
  gap: var(--bq-space-3);
  padding: var(--bq-space-2) var(--bq-space-3);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-md);
}

.progress-item__name {
  font-weight: var(--bq-weight-semibold);
  font-size: var(--bq-text-sm);
}

.progress-item__effort {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.progress-item__remaining {
  margin-left: auto;
  font-family: var(--bq-font-mono);
  font-size: var(--bq-text-xs);
  color: var(--bq-spotlight);
}

.actions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--bq-space-3);
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-2);
  padding: var(--bq-space-4);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-md);
}

.action-card--disabled {
  opacity: 0.55;
}

.action-card__head {
  display: flex;
  align-items: center;
  gap: var(--bq-space-2);
}

.action-card__name {
  font-weight: var(--bq-weight-semibold);
}

.action-card__tag {
  font-size: var(--bq-text-xs);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-stat-cash);
}

.action-card__desc {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
  line-height: var(--bq-leading-snug);
}

.action-card__reason {
  font-size: var(--bq-text-xs);
  color: var(--bq-ember);
}

.action-card__efforts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bq-space-2);
  margin-top: auto;
}

.effort-btn {
  padding: var(--bq-space-2) var(--bq-space-3);
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  color: var(--bq-text);
  background: var(--bq-bg-elevated);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-sm);
  cursor: pointer;
  transition:
    border-color var(--bq-dur-base) var(--bq-ease),
    color var(--bq-dur-base) var(--bq-ease);
}

.effort-btn:hover:not(:disabled) {
  border-color: var(--bq-spotlight);
  color: var(--bq-spotlight);
}

.effort-btn:disabled {
  cursor: not-allowed;
}

/* Preview de fadiga por opção de esforço (0014 it-05). */
.effort-btn {
  display: inline-flex;
  flex-direction: column;
  gap: var(--bq-space-1);
  text-align: left;
}

.effort-btn__fatigue {
  font-size: var(--bq-text-2xs, 0.6875rem);
  font-weight: var(--bq-weight-medium);
  color: var(--bq-text-muted);
}

.effort-btn__fatigue--warn {
  color: var(--bq-ember);
  font-weight: var(--bq-weight-semibold);
}
</style>
