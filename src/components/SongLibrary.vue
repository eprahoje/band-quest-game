<template>
  <div class="song-library">
    <CollapsibleSection
      title="Músicas"
      aria-label="Inventário de músicas"
      :hint="String(store.songs.length)"
      :default-open="false"
    >
      <p v-if="store.songs.length === 0" class="song-library__empty">
        Nenhuma música ainda. Componha a primeira!
      </p>
      <ul v-else class="lib-list">
        <li v-for="s in store.songs" :key="s.id" class="lib-row">
          <span class="lib-row__name">{{ s.name }}</span>
          <span class="lib-row__meta">{{ s.genre }} · {{ s.theme }}</span>
          <span class="lib-row__quality">Q {{ s.quality }}</span>
          <span class="lib-tag" :class="`lib-tag--${s.status}`">{{ SONG_STATUS_LABEL[s.status] }}</span>
        </li>
      </ul>
    </CollapsibleSection>

    <CollapsibleSection
      title="Lançamentos"
      aria-label="Discografia"
      :hint="String(store.releases.length)"
      :default-open="false"
    >
      <p v-if="store.releases.length === 0" class="song-library__empty">
        Nada lançado ainda. Grave uma demo, um single ou um álbum.
      </p>
      <ul v-else class="lib-list">
        <li v-for="r in store.releases" :key="r.id" class="lib-row">
          <span class="lib-tag" :class="`lib-tag--${r.type}`">{{ RELEASE_TYPE_LABEL[r.type] }}</span>
          <span class="lib-row__name">{{ r.title }}</span>
          <span class="lib-row__meta">{{ dateLabel(r.releaseTurn) }} · {{ r.trackIds.length }} faixa(s)</span>
          <span class="lib-row__quality">Q {{ r.quality }}</span>
        </li>
      </ul>
    </CollapsibleSection>
  </div>
</template>

<script setup lang="ts">
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import { useGameStore } from '@/stores/game'
import type { SongStatus } from '@/data/songs'
import type { ReleaseType } from '@/data/releases'

const store = useGameStore()

const SONG_STATUS_LABEL: Record<SongStatus, string> = {
  composed: 'Pronta',
  released: 'Lançada',
}

const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  demo: 'Demo',
  single: 'Single',
  album: 'Álbum',
}

function dateLabel(turn: number): string {
  const c = store.calendarAt(turn)
  return `${c.displayYear} · ${c.monthName}, dia ${c.day}`
}
</script>

<style scoped>
.song-library {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-5);
}

.song-library__empty {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-faint);
}

.lib-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-2);
}

.lib-row {
  display: flex;
  align-items: center;
  gap: var(--bq-space-3);
  padding: var(--bq-space-2) var(--bq-space-3);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-sm);
  font-size: var(--bq-text-sm);
}

.lib-row__name {
  font-weight: var(--bq-weight-semibold);
}

.lib-row__meta {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.lib-row__quality {
  margin-left: auto;
  flex-shrink: 0;
  font-family: var(--bq-font-mono);
  font-size: var(--bq-text-xs);
  color: var(--bq-spotlight);
}

/* Chip de status/tipo — espelha o .tag do design-system. */
.lib-tag {
  flex-shrink: 0;
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  padding: 1px var(--bq-space-2);
  border-radius: var(--bq-radius-pill);
}

.lib-tag--composed {
  color: var(--bq-positive);
  background: color-mix(in srgb, var(--bq-positive) 16%, transparent);
}

.lib-tag--released,
.lib-tag--single {
  color: var(--bq-spotlight);
  background: var(--bq-spotlight-dim);
}

.lib-tag--demo {
  color: var(--bq-text-muted);
  background: color-mix(in srgb, var(--bq-text-muted) 16%, transparent);
}

.lib-tag--album {
  color: var(--bq-info);
  background: color-mix(in srgb, var(--bq-info) 16%, transparent);
}
</style>
