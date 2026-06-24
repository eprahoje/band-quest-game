<template>
  <section class="event-feed" aria-label="Feed de eventos">
    <h2 class="event-feed__title">Acontecimentos</h2>

    <p v-if="store.recentEvents.length === 0" class="event-feed__empty">
      Nada aconteceu ainda. Faça sua banda agir!
    </p>

    <ol v-else class="event-feed__list">
      <li
        v-for="event in store.recentEvents"
        :key="event.id"
        class="event-item"
        :style="{ '--accent': categoryMeta[event.category].accent }"
      >
        <span class="event-item__icon">
          <component :is="categoryMeta[event.category].icon" :size="18" stroke-width="2" />
        </span>
        <div class="event-item__body">
          <p class="event-item__message">{{ event.message }}</p>
          <span class="event-item__meta">
            {{ categoryMeta[event.category].label }} · Turno {{ event.turn }}
          </span>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  IconMicrophone2,
  IconDeviceSpeaker,
  IconBus,
  IconBriefcase,
  IconTrophy,
  IconAlertTriangle,
  IconSpeakerphone,
  IconBarbell,
  IconMoon,
} from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import type { EventCategory } from '@/stores/game'

const store = useGameStore()

const categoryMeta: Record<EventCategory, { icon: Component; label: string; accent: string }> = {
  show: { icon: IconMicrophone2, label: 'Show', accent: 'var(--bq-stat-fans)' },
  recording: { icon: IconDeviceSpeaker, label: 'Gravação', accent: 'var(--bq-spotlight)' },
  tour: { icon: IconBus, label: 'Turnê', accent: 'var(--bq-info)' },
  negotiation: { icon: IconBriefcase, label: 'Negociação', accent: 'var(--bq-stat-cash)' },
  milestone: { icon: IconTrophy, label: 'Marco', accent: 'var(--bq-spotlight)' },
  setback: { icon: IconAlertTriangle, label: 'Revés', accent: 'var(--bq-negative)' },
  marketing: { icon: IconSpeakerphone, label: 'Marketing', accent: 'var(--bq-stat-cash)' },
  practice: { icon: IconBarbell, label: 'Ensaio', accent: 'var(--bq-stat-rep)' },
  rest: { icon: IconMoon, label: 'Descanso', accent: 'var(--bq-stat-fatigue)' },
}
</script>

<style scoped>
.event-feed {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-4);
}

.event-feed__title {
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-muted);
}

.event-feed__empty {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-faint);
  padding: var(--bq-space-4) 0;
}

.event-feed__list {
  position: relative;
  list-style: none;
  margin: 0;
  padding-left: var(--bq-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-4);
}

.event-feed__list::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: var(--bq-border);
}

.event-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--bq-space-3);
}

.event-item__icon {
  position: absolute;
  left: calc(-1 * var(--bq-space-6) + 4px);
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--bq-radius-pill);
  background: var(--bq-bg-elevated);
  border: 1px solid var(--bq-border-strong);
  color: var(--accent);
}

.event-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--bq-space-4);
}

.event-item__message {
  font-size: var(--bq-text-sm);
  line-height: var(--bq-leading-snug);
  color: var(--bq-text);
}

.event-item__meta {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-faint);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  font-family: var(--bq-font-mono);
}
</style>
