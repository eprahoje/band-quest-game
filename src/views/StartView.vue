<template>
  <main class="start-view">
    <h1 class="start-view__title">Band Quest</h1>
    <p class="start-view__subtitle">RPG de gestão de banda de rock</p>
    <button class="start-view__btn" @click="handleStart">Nova Partida</button>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const store = useGameStore()

function handleStart() {
  store.startGame({ bandName: 'Minha Banda', genre: 'Rock', originTrait: 'Banda de Garagem' })
  router.push('/game')
}
</script>

<style scoped>
.start-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.start-view__title {
  font-size: 3rem;
  font-weight: 900;
}

.start-view__subtitle {
  opacity: 0.6;
}

.start-view__btn {
  margin-top: 24px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  background: var(--color-accent, #cba6f7);
  color: #1e1e2e;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.start-view__btn:hover {
  opacity: 0.85;
}
</style>
