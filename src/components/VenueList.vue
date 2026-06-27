<template>
  <CollapsibleSection
    title="Locais"
    aria-label="Locais de show"
    :hint="`${unlockedCount}/${store.venueCatalog.length}`"
    :default-open="false"
  >
    <!-- Próximos shows agendados (compromissos datados, 0016 slice 2) -->
    <div v-if="store.scheduledShows.length" class="upcoming">
      <p class="upcoming__title">Próximos shows</p>
      <ul class="upcoming__list">
        <li v-for="s in store.scheduledShows" :key="s.id" class="upcoming__item">
          <span class="upcoming__venue">{{ venueName(s.venueId) }}</span>
          <span class="upcoming__date">{{ dateLabel(s.turnDue) }}</span>
        </li>
      </ul>
    </div>

    <p v-if="bookError" class="book-error">{{ bookError }}</p>
    <p v-else-if="atShowLimit" class="book-hint">Só um show por vez — a turnê libera agendar vários.</p>

    <ul class="venue-list">
      <li
        v-for="entry in store.venueCatalog"
        :key="entry.venue.id"
        class="venue-row"
        :class="{ 'venue-row--locked': !entry.unlocked }"
      >
        <span class="venue-row__tier">{{ VENUE_TIER_LABEL[entry.venue.tier] }}</span>
        <span class="venue-row__name">{{ entry.venue.name }}</span>
        <span class="venue-row__cap">{{ entry.venue.capacity.toLocaleString('pt-BR') }} lugares · ingresso R$ {{ entry.venue.ticketPrice }}</span>
        <template v-if="entry.unlocked">
          <span class="venue-row__book">Agendar:</span>
          <button
            v-for="lead in LEAD_OPTIONS"
            :key="lead.days"
            type="button"
            class="book-btn"
            :disabled="atShowLimit"
            @click="book(entry.venue.id, lead.days)"
          >
            {{ lead.label }}
          </button>
        </template>
        <span v-else class="venue-row__req">🔒 Requer {{ entry.missing }}</span>
      </li>
    </ul>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import { useGameStore } from '@/stores/game'
import { VENUE_TIER_LABEL, getVenue } from '@/data/venues'

const store = useGameStore()
const unlockedCount = computed(() => store.venueCatalog.filter((e) => e.unlocked).length)

// Limite "1 show por vez até a turnê" (Playtest 05 ponto 8).
const atShowLimit = computed(() => !store.canBookMultipleShows && store.scheduledShows.length >= 1)
const bookError = ref<string | null>(null)

// Antecedência do agendamento (compromisso datado, D4) — placeholders.
const LEAD_OPTIONS = [
  { days: 7, label: '1 sem' },
  { days: 14, label: '2 sem' },
  { days: 30, label: '1 mês' },
]

function book(venueId: string, days: number) {
  const r = store.scheduleShow(venueId, days)
  bookError.value = r.ok ? null : (r.reason ?? 'Não foi possível agendar.')
}

function venueName(id: string): string {
  return getVenue(id).name
}

function dateLabel(turn: number): string {
  const c = store.calendarAt(turn)
  return `${c.displayYear} · ${c.monthName}, dia ${c.day}`
}
</script>

<style scoped>
.upcoming {
  margin-bottom: var(--bq-space-4);
  padding: var(--bq-space-3);
  background: var(--bq-spotlight-dim);
  border-radius: var(--bq-radius-sm);
}

.upcoming__title {
  margin: 0 0 var(--bq-space-2);
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-spotlight);
}

.upcoming__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-1);
}

.upcoming__item {
  display: flex;
  gap: var(--bq-space-3);
  font-size: var(--bq-text-sm);
}

.upcoming__venue {
  font-weight: var(--bq-weight-semibold);
}

.upcoming__date {
  margin-left: auto;
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.book-error {
  margin: 0 0 var(--bq-space-3);
  font-size: var(--bq-text-sm);
  color: var(--bq-ember);
}

.book-hint {
  margin: 0 0 var(--bq-space-3);
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.venue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-2);
}

.venue-row {
  display: flex;
  align-items: center;
  gap: var(--bq-space-3);
  padding: var(--bq-space-2) var(--bq-space-3);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-sm);
  font-size: var(--bq-text-sm);
  flex-wrap: wrap;
}

.venue-row--locked {
  opacity: 0.6;
}

.venue-row__tier {
  flex-shrink: 0;
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-muted);
}

.venue-row__name {
  font-weight: var(--bq-weight-semibold);
}

.venue-row__cap {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.venue-row__req {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--bq-text-xs);
  color: var(--bq-text-faint);
}

.venue-row__book {
  margin-left: auto;
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.book-btn {
  flex-shrink: 0;
  padding: var(--bq-space-1) var(--bq-space-3);
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

.book-btn:hover {
  border-color: var(--bq-spotlight);
  color: var(--bq-spotlight);
}
</style>
