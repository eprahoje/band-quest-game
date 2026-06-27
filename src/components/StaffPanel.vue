<template>
  <CollapsibleSection
    title="Equipe"
    aria-label="Equipe e crew"
    :hint="String(store.hiredStaff.length)"
    :default-open="false"
  >
    <p class="staff__cost">
      Salário mensal da equipe: <strong>R$ {{ store.monthlyStaffCost }}</strong>
    </p>

    <ul v-if="store.hiredStaff.length" class="staff-list">
      <li v-for="m in store.hiredStaff" :key="m.id" class="staff-row">
        <span class="staff-row__name">{{ roleDef(m.role).label }}</span>
        <span class="staff-row__pay">R$ {{ roleDef(m.role).monthlySalary }}/mês</span>
        <button class="staff-btn staff-btn--ghost" type="button" @click="store.fireStaff(m.id)">
          Dispensar
        </button>
      </li>
    </ul>

    <p class="staff__sub">Contratar</p>
    <ul class="staff-list">
      <li v-for="role in STAFF_ROLES" :key="role.role" class="staff-row staff-row--hire">
        <span class="staff-row__name">{{ role.label }}</span>
        <span class="staff-row__desc">{{ role.description }}</span>
        <span class="staff-row__pay">R$ {{ role.hireCost }} + R$ {{ role.monthlySalary }}/mês</span>
        <button class="staff-btn" type="button" @click="store.hireStaff(role.role)">Contratar</button>
      </li>
    </ul>
  </CollapsibleSection>
</template>

<script setup lang="ts">
import CollapsibleSection from '@/components/CollapsibleSection.vue'
import { useGameStore } from '@/stores/game'
import { STAFF_ROLES, getStaffRole, type StaffRole } from '@/data/staff'

const store = useGameStore()
function roleDef(role: StaffRole) {
  return getStaffRole(role)
}
</script>

<style scoped>
.staff__cost {
  margin: 0 0 var(--bq-space-3);
  font-size: var(--bq-text-sm);
  color: var(--bq-text-muted);
}

.staff__cost strong {
  color: var(--bq-stat-cash);
}

.staff__sub {
  margin: var(--bq-space-4) 0 var(--bq-space-2);
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
}

.staff-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--bq-space-2);
}

.staff-row {
  display: flex;
  align-items: center;
  gap: var(--bq-space-3);
  flex-wrap: wrap;
  padding: var(--bq-space-2) var(--bq-space-3);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
  border-radius: var(--bq-radius-sm);
  font-size: var(--bq-text-sm);
}

.staff-row__name {
  font-weight: var(--bq-weight-semibold);
}

.staff-row__desc {
  font-size: var(--bq-text-xs);
  color: var(--bq-text-muted);
  flex: 1 1 160px;
}

.staff-row__pay {
  margin-left: auto;
  font-size: var(--bq-text-xs);
  font-family: var(--bq-font-mono);
  color: var(--bq-text-muted);
}

.staff-btn {
  flex-shrink: 0;
  padding: var(--bq-space-1) var(--bq-space-3);
  font-size: var(--bq-text-xs);
  font-weight: var(--bq-weight-semibold);
  color: var(--bq-text-on-accent);
  background: var(--bq-spotlight);
  border: none;
  border-radius: var(--bq-radius-sm);
  cursor: pointer;
}

.staff-btn--ghost {
  color: var(--bq-text-muted);
  background: var(--bq-bg-surface);
  border: 1px solid var(--bq-border);
}
</style>
