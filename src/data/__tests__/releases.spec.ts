import { describe, it, expect } from 'vitest'
import {
  createRelease,
  averageQuality,
  generateAlbumTitle,
  RELEASE_RULES,
} from '@/data/releases'
import type { Song } from '@/data/songs'

const half = () => 0.5

function song(id: string, quality: number, name = `Música ${id}`): Song {
  return { id, name, genre: 'Rock', theme: 'Estrada', quality, status: 'composed' }
}

describe('releases (feature 0015, slice 3)', () => {
  it('declares the composition rules (D3)', () => {
    expect(RELEASE_RULES.demo.songs).toBe(3)
    expect(RELEASE_RULES.single.songs).toBe(1)
    expect(RELEASE_RULES.album.singles).toBe(2)
    expect(RELEASE_RULES.album.songs).toBe(4)
  })

  it('averages the quality of the tracks', () => {
    expect(averageQuality([song('1', 40), song('2', 60)])).toBe(50)
    expect(averageQuality([])).toBe(0)
  })

  it('generates an album title from the pool', () => {
    expect(generateAlbumTitle(half).length).toBeGreaterThan(0)
  })

  it('single inherits the track name as title', () => {
    const r = createRelease({
      id: 'r1',
      type: 'single',
      releaseTurn: 5,
      tracks: [song('s1', 70, 'Última Estrada')],
      rng: half,
    })
    expect(r.type).toBe('single')
    expect(r.title).toBe('Última Estrada')
    expect(r.trackIds).toEqual(['s1'])
    expect(r.quality).toBe(70)
    expect(r.releaseTurn).toBe(5)
  })

  it('album gets a generated title and aggregates all track ids', () => {
    const r = createRelease({
      id: 'r2',
      type: 'album',
      releaseTurn: 10,
      tracks: [song('a', 50), song('b', 70), song('c', 90)],
      rng: half,
    })
    expect(r.type).toBe('album')
    expect(r.title.length).toBeGreaterThan(0)
    expect(r.trackIds).toEqual(['a', 'b', 'c'])
    expect(r.quality).toBe(70) // média 50/70/90
  })
})
