<template>
  <main class="game-view">
    <header class="game-view__header">
      <h1 class="game-view__band">{{ store.bandName }}</h1>
      <span class="turn-badge">Turno {{ store.turn }}</span>
    </header>

    <StatsPanel />

    <section class="roster" aria-label="Membros da banda">
      <h2 class="roster__title">Banda</h2>
      <div class="roster__grid">
        <MemberCard v-for="m in store.members" :key="m.memberId" :member="m" />
      </div>
    </section>

    <div class="game-view__actions">
      <button
        v-for="action in actions"
        :key="action.label"
        class="action-btn"
        @click="action.run"
      >
        {{ action.label }}
      </button>
    </div>

    <EventFeed />
  </main>
</template>

<script setup lang="ts">
import StatsPanel from '@/components/StatsPanel.vue'
import EventFeed from '@/components/EventFeed.vue'
import MemberCard from '@/components/MemberCard.vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()

const actions = [
  {
    label: 'Tocar um show',
    run() {
      store.applyStatDelta({ reputation: 4, cash: 150, fans: 30, fatigue: 15 })
      store.logEvent('show', 'A banda tocou em um bar lotado e ganhou novos fãs.')
      store.advanceTurn()
    },
  },
  {
    label: 'Gravar demo',
    run() {
      store.applyStatDelta({ reputation: 2, cash: -120, fatigue: 10 })
      store.logEvent('recording', 'Vocês gravaram uma demo no estúdio do bairro.')
      store.advanceTurn()
    },
  },
  {
    label: 'Descansar',
    run() {
      store.applyStatDelta({ fatigue: -30 })
      store.logEvent('milestone', 'A banda tirou uns dias de folga e recuperou energia.')
      store.advanceTurn()
    },
  },
]
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

.roster {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-3);
}

.roster__title {
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-muted);
}

.roster__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bq-space-4);
}

.game-view__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bq-space-2);
}

.action-btn {
  padding: var(--bq-space-3) var(--bq-space-5);
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  color: var(--bq-text);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-md);
  cursor: pointer;
  transition:
    border-color var(--bq-dur-base) var(--bq-ease),
    color var(--bq-dur-base) var(--bq-ease);
}

.action-btn:hover {
  border-color: var(--bq-spotlight);
  color: var(--bq-spotlight);
}
</style>
