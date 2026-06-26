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
  {
    id: 'r1',
    type: 'single',
    title: 'Última Estrada',
    releaseTurn: 40,
    trackIds: ['1'],
    quality: 72,
    fanBaseAtRelease: 120,
    currentRoyalty: 8,
    totalRoyaltiesEarned: 64,
  },
]

function editSong(id: string, patch: { name?: string; genre?: string; theme?: string }) {
  const s = songs.find((x) => x.id === id)
  if (!s) return
  if (patch.name?.trim()) s.name = patch.name.trim()
  if (patch.genre?.trim()) s.genre = patch.genre.trim()
  if (patch.theme?.trim()) s.theme = patch.theme.trim()
}
function renameRelease(id: string, title: string) {
  const r = releases.find((x) => x.id === id)
  if (r && title.trim()) r.title = title.trim()
}

vi.mock('@/stores/game', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/game')>()
  return {
    ...actual,
    useGameStore: () => ({ songs, releases, calendarAt: actual.computeCalendar, editSong, renameRelease }),
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

  it('shows the current royalty per release (D4)', () => {
    const wrapper = mount(SongLibrary)
    expect(wrapper.text()).toContain('R$ 8/dia')
  })

  it('shows the count hint per section', () => {
    const wrapper = mount(SongLibrary)
    const hints = wrapper.findAll('.collapsible__hint').map((h) => h.text())
    expect(hints).toContain('2') // músicas
    expect(hints).toContain('1') // lançamentos
  })

  // Edição inline (D7). Estes testes mutam o estado de amostra — ficam por último.
  it('edits a song name inline', async () => {
    const wrapper = mount(SongLibrary)
    await wrapper.findAll('.lib-edit')[0]!.trigger('click') // 1ª música
    await wrapper.find('.lib-input').setValue('Estrada Renomeada')
    const save = wrapper.findAll('.lib-btn').find((b) => b.text() === 'Salvar')
    await save!.trigger('click')
    expect(wrapper.text()).toContain('Estrada Renomeada')
  })

  it('renames a release inline', async () => {
    const wrapper = mount(SongLibrary)
    // o último botão de editar é o do lançamento (vem após as músicas)
    const editButtons = wrapper.findAll('.lib-edit')
    await editButtons[editButtons.length - 1]!.trigger('click')
    await wrapper.find('.lib-input').setValue('Hit do Verão')
    const save = wrapper.findAll('.lib-btn').find((b) => b.text() === 'Salvar')
    await save!.trigger('click')
    expect(wrapper.text()).toContain('Hit do Verão')
  })
})
