<template>
  <div class="song-library">
    <CollapsibleSection
      title="Músicas"
      aria-label="Inventário de músicas prontas"
      :hint="String(store.availableSongs.length)"
      :default-open="false"
    >
      <p v-if="store.availableSongs.length === 0" class="song-library__empty">
        Nenhuma música pronta. Componha uma nova — as lançadas ficam na aba Lançamentos.
      </p>
      <ul v-else class="lib-list">
        <li v-for="s in store.availableSongs" :key="s.id" class="lib-row">
          <template v-if="editingSongId === s.id">
            <input v-model="draft.name" class="lib-input" aria-label="Nome" placeholder="Nome" />
            <input v-model="draft.genre" class="lib-input lib-input--sm" aria-label="Estilo" placeholder="Estilo" />
            <input v-model="draft.theme" class="lib-input lib-input--sm" aria-label="Tema" placeholder="Tema" />
            <button class="lib-btn" type="button" @click="saveSong(s.id)">Salvar</button>
            <button class="lib-btn lib-btn--ghost" type="button" @click="cancelEdit">Cancelar</button>
          </template>
          <template v-else>
            <span class="lib-row__name">{{ s.name }}</span>
            <span class="lib-row__meta">{{ s.genre }} · {{ s.theme }}</span>
            <span class="lib-row__quality">Q {{ s.quality }}</span>
            <button class="lib-edit" type="button" aria-label="Editar música" @click="startEditSong(s)">
              ✎
            </button>
            <button
              v-if="s.status === 'composed'"
              class="lib-edit lib-edit--danger"
              type="button"
              aria-label="Descartar música"
              @click="discard(s)"
            >
              🗑
            </button>
          </template>
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
          <template v-if="editingReleaseId === r.id">
            <input v-model="releaseDraft" class="lib-input" aria-label="Título" placeholder="Título" />
            <button class="lib-btn" type="button" @click="saveRelease(r.id)">Salvar</button>
            <button class="lib-btn lib-btn--ghost" type="button" @click="cancelEdit">Cancelar</button>
          </template>
          <template v-else>
            <span class="lib-row__name">{{ r.title }}</span>
            <span class="lib-row__meta">{{ dateLabel(r.releaseTurn) }} · {{ trackNames(r) }}</span>
            <span class="lib-row__royalty">{{ royaltyLabel(r) }}</span>
            <span class="lib-row__quality">Q {{ r.quality }}</span>
            <button class="lib-edit" type="button" aria-label="Renomear lançamento" @click="startEditRelease(r)">
              ✎
            </button>
          </template>
        </li>
      </ul>
    </CollapsibleSection>

    <ConfirmDialog
      :open="!!discarding"
      title="Descartar música?"
      :message="discarding ? `“${discarding.name}” será removida da banda. Essa ação não pode ser desfeita.` : ''"
      confirm-label="Descartar"
      danger
      @confirm="confirmDiscard"
      @cancel="discarding = null"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useGameStore } from '@/stores/game'
import type { Song } from '@/data/songs'
import type { Release, ReleaseType } from '@/data/releases'

const store = useGameStore()

// Faixas de um lançamento, pelo nome (Playtest 04 ponto 2): as músicas lançadas vivem
// aqui, não na aba Músicas (que só lista as prontas, evitando confusão com o descarte).
function trackNames(r: Release): string {
  const names = r.trackIds
    .map((id) => store.songs.find((s) => s.id === id)?.name)
    .filter((n): n is string => !!n)
  return names.length ? names.join(', ') : '—'
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

// Royalty atual do lançamento (D4): R$/dia enquanto ativo; "—" quando expirado/sem renda.
function royaltyLabel(r: Release): string {
  const royalty = Math.round(r.currentRoyalty ?? 0)
  return royalty > 0 ? `R$ ${royalty}/dia` : '—'
}

// Edição inline de metadado (feature 0015, D7).
const editingSongId = ref<string | null>(null)
const editingReleaseId = ref<string | null>(null)
const draft = reactive({ name: '', genre: '', theme: '' })
const releaseDraft = ref('')

function startEditSong(s: Song) {
  editingReleaseId.value = null
  editingSongId.value = s.id
  draft.name = s.name
  draft.genre = s.genre
  draft.theme = s.theme
}

function saveSong(id: string) {
  store.editSong(id, { name: draft.name, genre: draft.genre, theme: draft.theme })
  editingSongId.value = null
}

function startEditRelease(r: Release) {
  editingSongId.value = null
  editingReleaseId.value = r.id
  releaseDraft.value = r.title
}

function saveRelease(id: string) {
  store.renameRelease(id, releaseDraft.value)
  editingReleaseId.value = null
}

function cancelEdit() {
  editingSongId.value = null
  editingReleaseId.value = null
}

// Descarte de música não lançada (Playtest 04 ponto 5). Música lançada não aparece com
// o botão (referenciada por um Release). Confirmação via ConfirmDialog do design system
// (Playtest 05 ponto 5 — substitui o window.confirm nativo).
const discarding = ref<Song | null>(null)
function discard(s: Song) {
  discarding.value = s
}
function confirmDiscard() {
  if (discarding.value) store.discardSong(discarding.value.id)
  discarding.value = null
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
  flex-shrink: 0;
  font-family: var(--bq-font-mono);
  font-size: var(--bq-text-xs);
  color: var(--bq-spotlight);
}

/* Músicas (sem royalty): a qualidade é o 1º item à direita e empurra o resto. */
.lib-row__meta + .lib-row__quality {
  margin-left: auto;
}

/* Royalty atual (D4) — empurra qualidade/edição para a direita. */
.lib-row__royalty {
  margin-left: auto;
  flex-shrink: 0;
  font-family: var(--bq-font-mono);
  font-size: var(--bq-text-xs);
  color: var(--bq-positive);
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

/* Edição inline (feature 0015, D7). */
.lib-edit {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--bq-text-faint);
  cursor: pointer;
  font-size: var(--bq-text-sm);
  padding: 0 var(--bq-space-1);
  transition: color var(--bq-dur-base) var(--bq-ease);
}

.lib-edit:hover {
  color: var(--bq-spotlight);
}

.lib-edit--danger:hover {
  color: var(--bq-ember);
}

.lib-input {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--bq-space-1) var(--bq-space-2);
  font-size: var(--bq-text-sm);
  color: var(--bq-text);
  background: var(--bq-bg);
  border: 1px solid var(--bq-border-strong);
  border-radius: var(--bq-radius-sm);
}

.lib-input--sm {
  flex: 0 1 120px;
}

.lib-btn {
  flex-shrink: 0;
  padding: var(--bq-space-1) var(--bq-space-3);
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  color: var(--bq-bg);
  background: var(--bq-spotlight);
  border: none;
  border-radius: var(--bq-radius-sm);
  cursor: pointer;
}

.lib-btn--ghost {
  color: var(--bq-text-muted);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
}
</style>
