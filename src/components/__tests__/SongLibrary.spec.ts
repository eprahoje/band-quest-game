import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Song } from '@/data/songs'
import type { Release } from '@/data/releases'
import { computeCalendar } from '@/stores/game'

// Estado de amostra: o inventário é independente do motor; mockamos o store.
const songs: Song[] = [
  { id: '1', name: 'Última Estrada', genre: 'Rock', theme: 'Estrada', quality: 72, status: 'released' },
  { id: '2', name: 'Nova Noite', genre: 'Rock', theme: 'Noite', quality: 55, status: 'composed' },
]
const releases: Release[] = [
  { id: 'r1', type: 'single', title: 'Última Estrada', releaseTurn: 40, trackIds: ['1'], quality: 72 },
]

vi.mock('@/stores/game', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/game')>()
  return {
    ...actual,
    useGameStore: () => ({ songs, releases, calendarAt: actual.computeCalendar }),
  }
})

import SongLibrary from '@/components/SongLibrary.vue'

describe('SongLibrary (feature 0015, slice 5)', () => {
  it('lists songs with metadata, quality and status', () => {
    const wrapper = mount(SongLibrary)
    expect(wrapper.text()).toContain('Última Estrada')
    expect(wrapper.text()).toContain('Nova Noite')
    expect(wrapper.text()).toContain('Estrada') // tema/gênero
    expect(wrapper.text()).toContain('Q 72')
    expect(wrapper.text()).toContain('Pronta') // status composed
    expect(wrapper.text()).toContain('Lançada') // status released
  })

  it('lists releases with type, title and formatted release date', () => {
    const wrapper = mount(SongLibrary)
    expect(wrapper.text()).toContain('Single')
    const c = computeCalendar(40)
    expect(wrapper.text()).toContain(`${c.displayYear} · ${c.monthName}, dia ${c.day}`)
    expect(wrapper.text()).toContain('1 faixa(s)')
  })

  it('shows the count hint per section', () => {
    const wrapper = mount(SongLibrary)
    const hints = wrapper.findAll('.collapsible__hint').map((h) => h.text())
    expect(hints).toContain('2') // músicas
    expect(hints).toContain('1') // lançamentos
  })
})
