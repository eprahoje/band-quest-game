<template>
  <section class="collapsible" :aria-label="title">
    <button
      class="collapsible__head"
      type="button"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="collapsible__title">{{ title }}</span>
      <span v-if="hint" class="collapsible__hint">{{ hint }}</span>
      <IconChevronDown
        class="collapsible__chevron"
        :class="{ 'collapsible__chevron--open': open }"
        :size="16"
        stroke-width="2.5"
      />
    </button>
    <div v-show="open" class="collapsible__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconChevronDown } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** Texto curto à direita do título (ex: contagem), visível mesmo recolhido. */
    hint?: string
    defaultOpen?: boolean
  }>(),
  { hint: '', defaultOpen: true },
)

const open = ref(props.defaultOpen)
</script>

<style scoped>
.collapsible {
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-3);
}

.collapsible__head {
  display: flex;
  align-items: center;
  gap: var(--bq-space-2);
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  /* Mesma tipografia de .section-title para não destoar das seções fixas. */
  font-size: var(--bq-text-sm);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-muted);
  transition: color var(--bq-dur-base) var(--bq-ease);
}

.collapsible__head:hover {
  color: var(--bq-text);
}

.collapsible__hint {
  font-size: var(--bq-text-xs);
  font-family: var(--bq-font-mono);
  color: var(--bq-text-faint);
  text-transform: none;
  letter-spacing: 0;
}

.collapsible__chevron {
  margin-left: auto;
  flex-shrink: 0;
  transition: transform var(--bq-dur-base) var(--bq-ease);
}

.collapsible__chevron--open {
  transform: rotate(180deg);
}
</style>
