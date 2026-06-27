<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="emit('cancel')" @keydown.escape="emit('cancel')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-label="title">
        <h2 class="dialog__title">{{ title }}</h2>
        <p v-if="message" class="dialog__msg">{{ message }}</p>
        <div class="dialog__actions">
          <button type="button" class="dlg-btn dlg-btn--ghost" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button
            ref="confirmBtn"
            type="button"
            class="dlg-btn"
            :class="danger ? 'dlg-btn--danger' : 'dlg-btn--primary'"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirmar', cancelLabel: 'Cancelar', danger: false },
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const confirmBtn = ref<HTMLButtonElement | null>(null)
// Foca o botão de confirmar ao abrir (acessibilidade — teclado/ESC).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) nextTick(() => confirmBtn.value?.focus())
  },
)
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--bq-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--bq-space-6);
  background: var(--bq-overlay);
}

.dialog {
  width: 100%;
  max-width: 380px;
  padding: var(--bq-space-5);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border-strong);
  border-radius: var(--bq-radius-lg);
  box-shadow: var(--bq-shadow-lg);
}

.dialog__title {
  font-family: var(--bq-font-display);
  font-weight: var(--bq-weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-display);
  font-size: var(--bq-text-lg);
  margin: 0 0 var(--bq-space-2);
}

.dialog__msg {
  font-size: var(--bq-text-sm);
  color: var(--bq-text-muted);
  margin: 0 0 var(--bq-space-5);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--bq-space-3);
}

.dlg-btn {
  padding: var(--bq-space-2) var(--bq-space-4);
  font: inherit;
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  border-radius: var(--bq-radius-md);
  cursor: pointer;
}

.dlg-btn--ghost {
  color: var(--bq-text-muted);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
}

.dlg-btn--ghost:hover {
  border-color: var(--bq-border-strong);
  color: var(--bq-text);
}

.dlg-btn--primary {
  color: var(--bq-text-on-accent);
  background: var(--bq-spotlight);
  border: 1px solid var(--bq-spotlight);
}

.dlg-btn--danger {
  color: #fff;
  background: var(--bq-ember);
  border: 1px solid var(--bq-ember);
}

.dlg-btn--danger:hover,
.dlg-btn--primary:hover {
  filter: brightness(1.08);
}
</style>
