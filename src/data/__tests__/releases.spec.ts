import { describe, it, expect } from 'vitest'
import {
  createRelease,
  averageQuality,
  generateAlbumTitle,
  RELEASE_RULES,
  initialRoyalty,
  accrueRoyalty,
  ROYALTY_PROFILE,
  ROYALTY_FLOOR,
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
      fanBase: 100,
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
      fanBase: 200,
      rng: half,
    })
    expect(r.type).toBe('album')
    expect(r.title.length).toBeGreaterThan(0)
    expect(r.trackIds).toEqual(['a', 'b', 'c'])
    expect(r.quality).toBe(70) // média 50/70/90
  })
})

describe('royalties (feature 0015, slice 4 / D4)', () => {
  it('seeds royalty fields on a release scaled by quality × fan base', () => {
    const r = createRelease({
      id: 'r1',
      type: 'single',
      releaseTurn: 5,
      tracks: [song('s1', 60, 'Hit')],
      fanBase: 100,
      rng: half,
    })
    expect(r.fanBaseAtRelease).toBe(100)
    expect(r.totalRoyaltiesEarned).toBe(0)
    // initialRoyalty(60, 100, single) = round(0.6 × (5 + 20) × 0.6) = round(9) = 9
    expect(r.currentRoyalty).toBe(initialRoyalty(60, 100, 'single'))
    expect(r.currentRoyalty).toBe(9)
  })

  it('demo never earns royalties (multiplier 0)', () => {
    expect(initialRoyalty(80, 500, 'demo')).toBe(0)
    expect(ROYALTY_PROFILE.demo.multiplier).toBe(0)
  })

  it('royalty grows with quality and fan base', () => {
    expect(initialRoyalty(80, 200, 'album')).toBeGreaterThan(initialRoyalty(40, 200, 'album'))
    expect(initialRoyalty(60, 400, 'single')).toBeGreaterThan(initialRoyalty(60, 50, 'single'))
  })

  it('accrues a geometric sum over days and decays the per-turn royalty', () => {
    // 1 dia: paga o royalty atual cheio e decai uma vez.
    const one = accrueRoyalty(100, 0.9, 1)
    expect(one.revenue).toBeCloseTo(100)
    expect(one.next).toBeCloseTo(90)
    // 3 dias: soma 100 + 90 + 81 = 271; restante 100·0.9³ = 72.9.
    const three = accrueRoyalty(100, 0.9, 3)
    expect(three.revenue).toBeCloseTo(271)
    expect(three.next).toBeCloseTo(72.9)
  })

  it('expires the royalty once it falls below the floor', () => {
    // Decai bastante: cai abaixo do piso e zera.
    const r = accrueRoyalty(ROYALTY_FLOOR, 0.5, 1)
    expect(r.next).toBe(0)
  })

  it('returns no revenue for an inactive (zero) royalty', () => {
    expect(accrueRoyalty(0, 0.9, 5)).toEqual({ revenue: 0, next: 0 })
  })
})
