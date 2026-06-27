<template>
  <div ref="root" class="select" :class="{ 'select--open': open }">
    <button
      type="button"
      class="select__button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click="toggle"
      @keydown.escape="close"
    >
      <span>{{ modelValue }}</span>
      <span class="select__chevron" aria-hidden="true">▾</span>
    </button>
    <ul v-if="open" class="select__list" role="listbox">
      <li v-for="opt in options" :key="opt">
        <button
          type="button"
          class="select__option"
          role="option"
          :aria-selected="opt === modelValue"
          @click="choose(opt)"
          @keydown.escape="close"
        >
          {{ opt }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  modelValue: string
  options: readonly string[]
  ariaLabel?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}
function choose(opt: string) {
  emit('update:modelValue', opt)
  open.value = false
}

// Fecha ao clicar fora (dropdown próprio — sem <select> nativo).
function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// referência usada só para o linter (props acessadas no template)
void props
</script>

<style scoped>
.select {
  position: relative;
}

.select__button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bq-space-2);
  padding: var(--bq-space-2) var(--bq-space-3);
  font: inherit;
  font-size: var(--bq-text-sm);
  color: var(--bq-text);
  background: var(--bq-bg-inset);
  border: 1px solid var(--bq-border-strong);
  border-radius: var(--bq-radius-sm);
  cursor: pointer;
  transition: border-color var(--bq-dur-base) var(--bq-ease);
}

.select__button:hover {
  border-color: var(--bq-spotlight);
}

.select__chevron {
  color: var(--bq-text-faint);
  transition: transform var(--bq-dur-base) var(--bq-ease);
}

.select--open .select__chevron {
  transform: rotate(180deg);
}

.select__list {
  position: absolute;
  z-index: var(--bq-z-overlay);
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: var(--bq-space-1);
  list-style: none;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bq-bg-elevated);
  border: 1px solid var(--bq-border-strong);
  border-radius: var(--bq-radius-md);
  box-shadow: var(--bq-shadow-lg);
}

.select__option {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--bq-space-2) var(--bq-space-3);
  font: inherit;
  font-size: var(--bq-text-sm);
  color: var(--bq-text);
  background: none;
  border: none;
  border-radius: var(--bq-radius-sm);
  cursor: pointer;
}

.select__option:hover,
.select__option:focus-visible {
  background: var(--bq-bg-surface);
  outline: none;
}

.select__option[aria-selected='true'] {
  color: var(--bq-spotlight);
  font-weight: var(--bq-weight-semibold);
}

.select__option[aria-selected='true']::after {
  content: '✓';
}
</style>
