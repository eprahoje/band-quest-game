<template>
  <section class="event-feed" aria-label="Feed de eventos">
    <h2 class="event-feed__title">Acontecimentos</h2>

    <p v-if="store.recentEvents.length === 0" class="event-feed__empty">
      Nada aconteceu ainda. Faça sua banda agir!
    </p>

    <ol v-else class="event-feed__list">
      <li v-for="event in store.recentEvents" :key="event.id" class="event-item">
        <span class="event-item__icon" :class="`event-item__icon--${event.category}`">
          <component :is="categoryMeta[event.category].icon" :size="18" stroke-width="1.5" />
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
} from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import type { EventCategory } from '@/stores/game'

const store = useGameStore()

const categoryMeta: Record<EventCategory, { icon: Component; label: string }> = {
  show: { icon: IconMicrophone2, label: 'Show' },
  recording: { icon: IconDeviceSpeaker, label: 'Gravação' },
  tour: { icon: IconBus, label: 'Turnê' },
  negotiation: { icon: IconBriefcase, label: 'Negociação' },
  milestone: { icon: IconTrophy, label: 'Marco' },
  setback: { icon: IconAlertTriangle, label: 'Revés' },
}
</script>

<style scoped>
.event-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-feed__title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.event-feed__empty {
  font-size: 0.9rem;
  opacity: 0.5;
  padding: 16px 0;
}

.event-feed__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface, #1e1e2e);
  border: 1px solid var(--color-border, #313244);
  border-radius: 8px;
}

.event-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-border, #313244);
  color: var(--color-text, #cdd6f4);
}

.event-item__icon--milestone {
  color: #f9e2af;
}

.event-item__icon--setback {
  color: #f38ba8;
}

.event-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-item__message {
  font-size: 0.9rem;
  line-height: 1.3;
  color: var(--color-text, #cdd6f4);
}

.event-item__meta {
  font-size: 0.7rem;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
