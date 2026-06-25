<template>
  <main class="result-view">
    <p class="result-view__band">{{ store.bandName }}</p>

    <template v-if="store.outcome?.type === 'success'">
      <h1 class="result-view__title">Fim da jornada</h1>
      <p class="result-view__subtitle">{{ store.durationYears }} anos de carreira</p>
      <div class="result-view__stars" :aria-label="`${store.outcome.stars} de 5 estrelas`">
        <span v-for="n in 5" :key="n" class="star" :class="{ 'star--on': n <= (store.outcome.stars ?? 0) }">★</span>
      </div>
      <p class="result-view__score">Pontuação final: {{ store.outcome.score }}</p>
    </template>

    <template v-else>
      <h1 class="result-view__title result-view__title--defeat">Game Over</h1>
      <p class="result-view__subtitle">{{ store.outcome?.reason ?? 'A banda acabou' }}</p>
      <p class="result-view__defeat-copy">A banda não resistiu às dívidas e se desfez.</p>
    </template>

    <ul class="result-view__stats">
      <li><span>Reputação</span><strong>{{ store.stats.reputation }}</strong></li>
      <li><span>Fãs</span><strong>{{ store.stats.fans }}</strong></li>
      <li><span>Caixa</span><strong>R$ {{ store.stats.cash }}</strong></li>
    </ul>

    <button class="result-view__btn" type="button" @click="newGame">Novo jogo</button>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const store = useGameStore()

function newGame() {
  store.resetGame()
  router.push('/')
}
</script>

<style scoped>
.result-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: var(--bq-space-3);
  padding: var(--bq-space-6);
  text-align: center;
}

.result-view__band {
  font-family: var(--bq-font-mono);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-spotlight);
  font-size: var(--bq-text-sm);
}

.result-view__title {
  font-size: var(--bq-text-3xl);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-display);
}

.result-view__title--defeat {
  color: var(--bq-negative);
}

.result-view__subtitle {
  color: var(--bq-text-muted);
  font-size: var(--bq-text-lg);
}

.result-view__stars {
  display: flex;
  gap: var(--bq-space-2);
  font-size: var(--bq-text-3xl);
  margin: var(--bq-space-3) 0;
}

.star {
  color: var(--bq-border-strong);
}

.star--on {
  color: var(--bq-spotlight);
}

.result-view__score {
  color: var(--bq-text-muted);
}

.result-view__defeat-copy {
  color: var(--bq-text-muted);
  max-width: 36ch;
}

.result-view__stats {
  list-style: none;
  margin: var(--bq-space-4) 0;
  padding: 0;
  display: flex;
  gap: var(--bq-space-5);
}

.result-view__stats li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-view__stats span {
  font-size: var(--bq-text-xs);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-faint);
}

.result-view__stats strong {
  font-family: var(--bq-font-display);
  font-size: var(--bq-text-xl);
}

.result-view__btn {
  margin-top: var(--bq-space-4);
  padding: var(--bq-space-3) var(--bq-space-7);
  font-family: var(--bq-font-display);
  font-size: var(--bq-text-md);
  font-weight: var(--bq-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--bq-tracking-caps);
  color: var(--bq-text-on-accent);
  background: var(--bq-spotlight);
  border: none;
  border-radius: var(--bq-radius-md);
  cursor: pointer;
  transition: box-shadow var(--bq-dur-base) var(--bq-ease);
}

.result-view__btn:hover {
  box-shadow: var(--bq-glow-spotlight);
}
</style>
