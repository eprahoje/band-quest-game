import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GameView from '@/views/GameView.vue'
import { useGameStore } from '@/stores/game'

describe('GameView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    const store = useGameStore()
    store.setRandomSource(() => 0.5)
    store.startGame({ bandName: 'The Fuzz', genre: 'Rock', originTrait: 'Garagem' })
  })

  function render() {
    return mount(GameView, { global: { plugins: [pinia] } })
  }

  it('renders the band name and the weekly calendar badge', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('The Fuzz')
    expect(wrapper.text()).toContain('Ano 1')
    expect(wrapper.text()).toContain('Semana 1')
  })

  it('renders an action card with effort buttons for each catalog action', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('Tocar show')
    expect(wrapper.text()).toContain('Gravar álbum')
    expect(wrapper.findAll('.effort-btn').length).toBeGreaterThan(0)
  })

  it('starts an action when an effort button is clicked', async () => {
    const wrapper = render()
    const store = useGameStore()
    const showBtn = wrapper.findAll('.effort-btn').find((b) => b.text().includes('Show local'))
    expect(showBtn).toBeTruthy()
    await showBtn!.trigger('click')
    expect(store.activeActions).toHaveLength(1)
    expect(store.activeActions[0]?.actionId).toBe('play-show')
  })

  it('advances the week and completes a queued action', async () => {
    const wrapper = render()
    const store = useGameStore()
    const showBtn = wrapper.findAll('.effort-btn').find((b) => b.text().includes('Show local'))
    await showBtn!.trigger('click')
    const advanceBtn = wrapper.findAll('button').find((b) => b.text().includes('Avançar semana'))
    expect(advanceBtn).toBeTruthy()
    await advanceBtn!.trigger('click')
    expect(store.turn).toBe(2)
    expect(store.activeActions).toHaveLength(0)
  })
})
