<template>
  <article class="member-card" :style="{ '--accent': member.accent }">
    <div class="member-card__head">
      <span class="member-card__avatar">
        <img :src="iconUrl" :alt="member.name" width="56" height="56" />
      </span>
      <div>
        <h3 class="member-card__name">{{ member.name }}</h3>
        <p class="member-card__role">{{ roleLabel }}</p>
      </div>
    </div>

    <dl class="member-card__attrs">
      <div v-for="attr in ATTRIBUTE_META" :key="attr.key" class="attr">
        <dt class="attr__label">{{ attr.label }}</dt>
        <dd class="attr__value">{{ member.attributes[attr.key] }}</dd>
        <div class="attr__track">
          <div
            class="attr__fill"
            :style="{ width: member.attributes[attr.key] + '%', background: attr.color }"
          />
        </div>
      </div>
    </dl>

    <footer class="member-card__ribbon">
      <span class="member-card__top">★ {{ topAttribute.label }}</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ROLE_LABEL, ATTRIBUTE_META, type BandMember } from '@/data/cast'

const props = defineProps<{ member: BandMember }>()

const roleLabel = computed(() => ROLE_LABEL[props.member.role])

const topAttribute = computed(() =>
  [...ATTRIBUTE_META].sort(
    (a, b) => props.member.attributes[b.key] - props.member.attributes[a.key],
  )[0]!,
)

// Resolve a URL do SVG do membro a partir do nome do arquivo.
const iconModules = import.meta.glob('@/assets/members/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const iconUrl = computed(() => {
  const entry = Object.entries(iconModules).find(([path]) =>
    path.endsWith('/' + props.member.icon),
  )
  return entry?.[1] ?? ''
})
</script>

<style scoped>
.member-card {
  width: 240px;
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-lg);
  overflow: hidden;
  box-shadow: var(--bq-shadow-md);
}

.member-card__head {
  display: flex;
  gap: var(--bq-space-3);
  padding: var(--bq-space-4);
  align-items: center;
}

.member-card__avatar {
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: var(--bq-radius-pill);
  overflow: hidden;
  border: 1px solid var(--bq-border-strong);
  background: linear-gradient(160deg, var(--bq-bg-elevated), var(--bq-bg-inset));
}

.member-card__avatar img {
  display: block;
  width: 100%;
  height: 100%;
}

.member-card__name {
  font-family: var(--bq-font-display);
  font-weight: var(--bq-weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-display);
  font-size: var(--bq-text-lg);
  line-height: var(--bq-leading-tight);
}

.member-card__role {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  margin-top: 2px;
}

.member-card__attrs {
  margin: 0;
  padding: 0 var(--bq-space-4) var(--bq-space-4);
  display: grid;
  gap: var(--bq-space-3);
}

.attr {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--bq-space-1);
}

.attr__label {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
}

.attr__value {
  margin: 0;
  font-family: var(--bq-font-mono);
  font-size: var(--bq-text-xs);
  color: var(--bq-text);
}

.attr__track {
  grid-column: 1 / -1;
  height: 6px;
  background: var(--bq-bg-inset);
  border-radius: var(--bq-radius-pill);
  overflow: hidden;
}

.attr__fill {
  height: 100%;
  border-radius: var(--bq-radius-pill);
}

.member-card__ribbon {
  padding: var(--bq-space-2) var(--bq-space-4);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  border-top: 1px solid var(--bq-border);
}

.member-card__top {
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  color: var(--accent);
}
</style>
