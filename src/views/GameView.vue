<template>
  <main class="game-view">
    <header class="game-view__header">
      <h1 class="game-view__band">{{ store.bandName }}</h1>
      <span class="turn-badge">
        Ano {{ store.calendar.year }} · {{ store.calendar.monthName }}, dia {{ store.calendar.day }}
      </span>
    </header>

    <StatsPanel />

    <section class="loop-bar" aria-label="Calendário">
      <span class="loop-bar__songs">Músicas prontas: <strong>{{ store.songs }}</strong></span>
      <button class="advance-btn" type="button" @click="advance">{{ advanceLabel }}</button>
    </section>

    <section class="costs" aria-label="Custos da banda">
      <h2 class="section-title">Custos</h2>
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
    </section>

    <section class="roster" aria-label="Membros da banda">
      <h2 class="section-title">Banda</h2>
      <div class="roster__grid">
        <MemberCard v-for="m in store.members" :key="m.memberId" :member="m" />
      </div>
    </section>

    <section class="in-progress" aria-label="Ações em andamento">
      <h2 class="section-title">Em andamento</h2>
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
    </section>

    <section class="actions" aria-label="Ações disponíveis">
      <h2 class="section-title">Ações</h2>
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
              {{ effort.label }} · {{ effort.durationTurns }} dias
            </button>
          </div>
        </article>
      </div>
    </section>

    <EventFeed />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatsPanel from '@/components/StatsPanel.vue'
import EventFeed from '@/components/EventFeed.vue'
import MemberCard from '@/components/MemberCard.vue'
import { useGameStore } from '@/stores/game'
import { ACTIONS, type ActionDef, type ActionEffortOption } from '@/data/actions'

const store = useGameStore()

const actionGroups = computed(() =>
  ACTIONS.map((action) => {
    const check = store.canStartAction(action.id)
    const baseCash = action.outcome.metrics.cash ?? 0
    const cost = baseCash < 0 ? -baseCash : 0
    const reqs: string[] = []
    if (action.requires?.songs) reqs.push(`${action.requires.songs} música(s)`)
    if (action.requires?.reputation) reqs.push(`${action.requires.reputation} de reputação`)
    return { action, disabled: !check.ok, reason: check.reason, cost, reqs }
  }),
)

const advanceLabel = computed(() => {
  const days = store.nextCompletionDays
  if (store.activeActions.length === 0) return 'Avançar 1 dia ›'
  return `Avançar ${days} ${days === 1 ? 'dia' : 'dias'} ›`
})

function start(action: ActionDef, effort: ActionEffortOption) {
  store.startAction(action.id, effort.label)
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

.loop-bar__songs {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-muted);
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
</style>
