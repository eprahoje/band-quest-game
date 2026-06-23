<template>
  <div class="stats-panel" role="region" aria-label="Band stats">
    <div
      v-for="card in statCards"
      :key="card.key"
      class="stat-card"
      :class="{ 'stat-card--warning': card.warning }"
      :style="{ '--accent': card.accent }"
    >
      <span class="stat-card__icon">
        <component :is="card.icon" :size="20" stroke-width="2" />
      </span>
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
  IconBolt,
} from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()

const statCards = computed(() => [
  {
    key: 'reputation',
    label: 'Reputação',
    icon: IconStar,
    accent: 'var(--bq-stat-rep)',
    formatted: `${store.stats.reputation}/100`,
    warning: false,
  },
  {
    key: 'cash',
    label: 'Caixa',
    icon: IconCurrencyDollar,
    accent: 'var(--bq-stat-cash)',
    formatted: formatCash(store.stats.cash),
    warning: store.stats.cash < 100,
  },
  {
    key: 'fans',
    label: 'Fãs',
    icon: IconUsers,
    accent: 'var(--bq-stat-fans)',
    formatted: formatFans(store.stats.fans),
    warning: false,
  },
  {
    key: 'fatigue',
    label: 'Fadiga',
    icon: IconBolt,
    accent: 'var(--bq-stat-fatigue)',
    formatted: `${store.stats.fatigue}/100`,
    warning: store.stats.fatigue >= 80,
  },
])

function formatCash(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`
  return `R$ ${value}`
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--bq-space-4);
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-1);
  padding: var(--bq-space-4);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-lg);
  overflow: hidden;
  transition: border-color var(--bq-dur-base) var(--bq-ease);
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--accent);
}

.stat-card--warning {
  border-color: var(--bq-ember);
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-bottom: var(--bq-space-2);
  border-radius: var(--bq-radius-md);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}

.stat-card__value {
  font-family: var(--bq-font-display);
  font-weight: var(--bq-weight-bold);
  font-size: var(--bq-text-2xl);
  font-variant-numeric: tabular-nums;
  line-height: var(--bq-leading-tight);
}

.stat-card__label {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
}
</style>
