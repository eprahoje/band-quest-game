<template>
  <main class="game-view">
    <header class="game-view__header">
      <h1>{{ store.bandName }}</h1>
      <span class="turn-badge">Turno {{ store.turn }}</span>
    </header>
    <StatsPanel />
  </main>
</template>

<script setup lang="ts">
import StatsPanel from '@/components/StatsPanel.vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()
</script>

<style scoped>
.game-view {
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
}

.game-view__header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 24px;
}

.game-view__header h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.turn-badge {
  font-size: 0.8rem;
  opacity: 0.5;
}
</style>
