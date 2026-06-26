import { describe, it, expect } from 'vitest'
import {
  createSong,
  generateSongName,
  pickTheme,
  rollSongQuality,
  SONG_THEMES,
} from '@/data/songs'

const half = () => 0.5

describe('songs (feature 0015)', () => {
  it('generates a non-empty name and a theme from the pool', () => {
    expect(generateSongName(half).length).toBeGreaterThan(0)
    expect(SONG_THEMES).toContain(pickTheme(half))
  })

  it('rolls quality within 1..100 and rewards effort', () => {
    const base = rollSongQuality({ bandQuality: 0.5, rng: half })
    const effortful = rollSongQuality({ bandQuality: 0.5, effortModifier: 1.6, rng: half })
    expect(base).toBeGreaterThanOrEqual(1)
    expect(base).toBeLessThanOrEqual(100)
    expect(effortful).toBeGreaterThan(base) // caprichar rende qualidade
  })

  it('quality scales with band quality', () => {
    const weak = rollSongQuality({ bandQuality: 0.2, rng: half })
    const strong = rollSongQuality({ bandQuality: 0.9, rng: half })
    expect(strong).toBeGreaterThan(weak)
  })

  it('createSong inherits the genre and starts composed', () => {
    const song = createSong({ id: '1', genre: 'Rock', bandQuality: 0.6, rng: half })
    expect(song.id).toBe('1')
    expect(song.genre).toBe('Rock')
    expect(song.status).toBe('composed')
    expect(song.name.length).toBeGreaterThan(0)
    expect(SONG_THEMES).toContain(song.theme)
  })

  it('honors explicit name/theme overrides (editable metadata, D1)', () => {
    const song = createSong({
      id: '2',
      genre: 'Pop',
      bandQuality: 0.6,
      name: 'Minha Canção',
      theme: 'Amor',
      rng: half,
    })
    expect(song.name).toBe('Minha Canção')
    expect(song.theme).toBe('Amor')
  })
})
