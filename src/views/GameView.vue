<template>
  <main class="game-view">
    <header class="game-view__header">
      <h1>{{ store.bandName }}</h1>
      <span class="turn-badge">Turno {{ store.turn }}</span>
    </header>

    <StatsPanel />

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
  gap: 24px;
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
}

.game-view__header {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.game-view__header h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.turn-badge {
  font-size: 0.8rem;
  opacity: 0.5;
}

.game-view__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--color-surface, #1e1e2e);
  color: var(--color-text, #cdd6f4);
  border: 1px solid var(--color-border, #313244);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.action-btn:hover {
  border-color: var(--color-accent, #cba6f7);
}
</style>
