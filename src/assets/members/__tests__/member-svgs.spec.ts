import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Valida os SVGs de membros (feature 0007) conforme a política em AGENTS.md.
const membersDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Cast canônico — espelho de
// band-quest-docs/docs/features/band-members-and-roster/planning/design.md
const CAST_SLUGS = [
  'lila-tavares', 'jucara-bonfim', 'dilson-prado',
  'rita-camargo', 'brenno-sales', 'teo-vasconcelos',
  'nara-siqueira', 'iuri-mendes', 'caique-romero',
  'tuca-andrade', 'janaina-costa', 'mari-sato',
  'vava-coutinho', 'caca-lemos', 'ailton-reis',
]

const svgFiles = readdirSync(membersDir).filter((f) => f.endsWith('.svg'))

function parse(content: string): Document {
  return new DOMParser().parseFromString(content, 'image/svg+xml')
}

describe('member SVGs', () => {
  it('has at least one member SVG', () => {
    expect(svgFiles.length).toBeGreaterThan(0)
  })

  it.each(svgFiles)('%s is well-formed and on-spec', (file) => {
    const content = readFileSync(resolve(membersDir, file), 'utf-8')
    const doc = parse(content)

    // 1. well-formed XML (catches e.g. `--` inside comments, unclosed tags)
    expect(doc.querySelector('parsererror')).toBeNull()

    const svg = doc.documentElement
    expect(svg.localName.toLowerCase()).toBe('svg')

    // 2. square viewBox
    const vb = svg.getAttribute('viewBox')
    expect(vb, 'missing viewBox').toBeTruthy()
    const [, , w, h] = vb!.trim().split(/[\s,]+/).map(Number)
    expect(w).toBeGreaterThan(0)
    expect(w).toBe(h)

    // 3. no embedded raster
    expect(doc.querySelector('image')).toBeNull()

    // 4. no opaque full-bleed background rectangle (assets must be transparent)
    const fullBleed = Array.from(doc.querySelectorAll('rect')).some((r) => {
      const x = Number(r.getAttribute('x') ?? '0')
      const y = Number(r.getAttribute('y') ?? '0')
      const rw = Number(r.getAttribute('width') ?? '0')
      const rh = Number(r.getAttribute('height') ?? '0')
      const fill = (r.getAttribute('fill') ?? '').toLowerCase()
      const opaque = fill !== '' && fill !== 'none' && fill !== 'transparent'
      return opaque && x <= 0 && y <= 0 && rw >= w && rh >= h
    })
    expect(fullBleed, 'opaque full-bleed background not allowed').toBe(false)

    // 5. filename pattern + known cast slug
    const m = file.match(/^member-([a-z0-9-]+)\.svg$/)
    expect(m, `unexpected filename: ${file}`).not.toBeNull()
    expect(CAST_SLUGS).toContain(m![1])
  })
})
