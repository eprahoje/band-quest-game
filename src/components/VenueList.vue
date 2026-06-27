<template>
  <CollapsibleSection
    title="Locais"
    aria-label="Locais de show"
    :hint="`${unlockedCount}/${store.venueCatalog.length}`"
    :default-open="false"
  >
    <ul class="venue-list">
      <li
        v-for="entry in store.venueCatalog"
        :key="entry.venue.id"
        class="venue-row"
        :class="{ 'venue-row--locked': !entry.unlocked }"
      >
        <span class="venue-row__tier">{{ VENUE_TIER_LABEL[entry.venue.tier] }}</span>
        <span class="venue-row__name">{{ entry.venue.name }}</span>
        <span class="venue-row__cap">{{ entry.venue.capacity.toLocaleString('pt-BR') }} lugares</span>
        <span v-if="entry.unlocked" class="venue-tag venue-tag--ok">Liberado</span>
        <span v-else class="venue-row__req">🔒 Requer {{ entry.missing }}</span>
      </li>
    </ul>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import { useGameStore } from '@/stores/game'
import { VENUE_TIER_LABEL } from '@/data/venues'

const store = useGameStore()
const unlockedCount = computed(() => store.venueCatalog.filter((e) => e.unlocked).length)
</script>

<style scoped>
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

.venue-tag {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  padding: 1px var(--bq-space-2);
  border-radius: var(--bq-radius-pill);
}

.venue-tag--ok {
  color: var(--bq-positive);
  background: color-mix(in srgb, var(--bq-positive) 16%, transparent);
}
</style>
