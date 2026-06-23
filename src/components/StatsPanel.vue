<template>
  <div class="stats-panel" role="region" aria-label="Band stats">
    <div
      v-for="card in statCards"
      :key="card.key"
      class="stat-card"
      :class="{ 'stat-card--warning': card.warning }"
    >
      <component :is="card.icon" class="stat-card__icon" :size="24" stroke-width="1.5" />
      <span class="stat-card__value">{{ card.formatted }}</span>
      <span class="stat-card__label">{{ card.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  IconStar,
  IconCurrencyDollar,
  IconUsers,
  IconHeartOff,
} from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()

const statCards = computed(() => [
  {
    key: 'reputation',
    label: 'Reputação',
    icon: IconStar,
    formatted: `${store.stats.reputation}/100`,
    warning: false,
  },
  {
    key: 'cash',
    label: 'Caixa',
    icon: IconCurrencyDollar,
    formatted: formatCash(store.stats.cash),
    warning: store.stats.cash < 100,
  },
  {
    key: 'fans',
    label: 'Fãs',
    icon: IconUsers,
    formatted: formatFans(store.stats.fans),
    warning: false,
  },
  {
    key: 'fatigue',
    label: 'Fadiga',
    icon: IconHeartOff,
    formatted: `${store.stats.fatigue}/100`,
    warning: store.stats.fatigue >= 80,
  },
])

function formatCash(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(1)}k`
  return `R$${value}`
}

function formatFans(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return `${value}`
}
</script>

<style scoped>
.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: var(--color-surface, #1e1e2e);
  border: 1px solid var(--color-border, #313244);
  border-radius: 8px;
  color: var(--color-text, #cdd6f4);
  transition: border-color 0.2s;
}

.stat-card--warning {
  border-color: var(--color-warning, #f38ba8);
  color: var(--color-warning, #f38ba8);
}

.stat-card__icon {
  opacity: 0.7;
}

.stat-card__value {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
}

.stat-card__label {
  font-size: 0.75rem;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
