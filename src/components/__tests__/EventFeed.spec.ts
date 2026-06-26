import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Eventos fabricados: o cap do feed é independente do motor de ações (cujos
// números de balance são placeholders). Mockamos o store para um render determinístico.
function makeEvents(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    turn: i + 1,
    category: 'show' as const,
    message: `Evento ${i + 1}`,
    effects: [],
  }))
}

const recentEvents = makeEvents(45)

vi.mock('@/stores/game', () => ({
  useGameStore: () => ({ recentEvents }),
}))

import EventFeed from '@/components/EventFeed.vue'

describe('EventFeed', () => {
  it('caps the rendered timeline at 40 items and reports the rest as hidden', () => {
    const wrapper = mount(EventFeed)
    expect(wrapper.findAll('.event-item')).toHaveLength(40)
    expect(wrapper.text()).toContain('+ 5 acontecimento(s) anterior(es)')
  })

  it('renders the most recent events first (no hidden notice under the cap)', () => {
    recentEvents.length = 0
    recentEvents.push(...makeEvents(3))
    const wrapper = mount(EventFeed)
    expect(wrapper.findAll('.event-item')).toHaveLength(3)
    expect(wrapper.find('.event-feed__more').exists()).toBe(false)
  })
})
