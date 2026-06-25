<template>
  <main class="start-view">
    <h1 class="start-view__title">Band <span>Quest</span></h1>
    <p class="start-view__subtitle">RPG de gestão de banda de rock</p>

    <fieldset class="start-view__modes">
      <legend class="start-view__legend">Duração da carreira</legend>
      <button
        v-for="opt in modeOptions"
        :key="opt.label"
        type="button"
        class="mode-btn"
        :class="{ 'mode-btn--active': isSelected(opt) }"
        @click="selected = opt"
      >
        {{ opt.label }}
      </button>
    </fieldset>

    <button class="start-view__btn" @click="handleStart">Nova Partida</button>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { TIMED_DURATIONS, type SessionMode } from '@/data/session'

interface ModeOption {
  label: string
  mode: SessionMode
  durationYears: number
}

const modeOptions: ModeOption[] = [
  ...TIMED_DURATIONS.map((y) => ({ label: `${y} anos`, mode: 'timed' as SessionMode, durationYears: y })),
  { label: 'Livre', mode: 'free', durationYears: 0 },
]

const router = useRouter()
const store = useGameStore()
const selected = ref<ModeOption>(modeOptions[0]!)

function isSelected(opt: ModeOption): boolean {
  return selected.value.mode === opt.mode && selected.value.durationYears === opt.durationYears
}

function handleStart() {
  store.startGame({
    bandName: 'Minha Banda',
    genre: 'Rock',
    originTrait: 'Banda de Garagem',
    sessionMode: selected.value.mode,
    durationYears: selected.value.durationYears,
  })
  router.push('/game')
}
</script>

<style scoped>
.start-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: var(--bq-space-4);
  padding: var(--bq-space-6);
  text-align: center;
}

.start-view__title {
  font-size: var(--bq-text-3xl);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-display);
}

.start-view__title span {
  color: var(--bq-spotlight);
}

.start-view__subtitle {
  color: var(--bq-text-muted);
  font-size: var(--bq-text-lg);
}

.start-view__modes {
  border: none;
  margin: var(--bq-space-4) 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--bq-space-2);
}

.start-view__legend {
  font-size: var(--bq-text-xs);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-faint);
  margin-bottom: var(--bq-space-2);
}

.mode-btn {
  padding: var(--bq-space-2) var(--bq-space-4);
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

.mode-btn--active {
  border-color: var(--bq-spotlight);
  color: var(--bq-spotlight);
}

.start-view__btn {
  margin-top: var(--bq-space-5);
  padding: var(--bq-space-3) var(--bq-space-7);
  font-family: var(--bq-font-display);
  font-size: var(--bq-text-md);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-on-accent);
  background: var(--bq-spotlight);
  border: none;
  border-radius: var(--bq-radius-md);
  cursor: pointer;
  transition: box-shadow var(--bq-dur-base) var(--bq-ease);
}

.start-view__btn:hover {
  box-shadow: var(--bq-glow-spotlight);
}
</style>
