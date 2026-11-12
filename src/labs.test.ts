import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { codeLines, findLine } from './core/code'
import { eigSym, erf, lgamma } from './core/math'
import type { Prim, Step } from './core/types'
import { LABS } from './labs'

function finite(p: Prim): boolean {
  const nums: number[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'number') nums.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(p)
  return nums.every(Number.isFinite)
}

function checkSteps(steps: Step[], file?: string) {
  expect(steps.length).toBeGreaterThan(0)
  const lines = file ? codeLines(file) : []
  for (const s of steps) {
    expect(s.title.length).toBeGreaterThan(0)
    if (file && s.line) expect(findLine(lines, s.line), `"${s.line}" not found in ${file}`).toBeGreaterThanOrEqual(0)
    for (const p of s.scene) expect(finite(p), `non-finite number in ${p.k}:${p.id} at "${s.title}"`).toBe(true)
    const ids = s.scene.map((p) => `${p.k}:${p.id}`)
    expect(new Set(ids).size, `duplicate prim ids at "${s.title}"`).toBe(ids.length)
  }
}

describe.each(LABS.map((l) => [l.name, l] as const))('%s', (_, lab) => {
  it('lessons build valid scenes', () => {
    for (const l of lab.lessons) checkSteps(l.steps())
  })
  for (const e of lab.experiments) {
    it(`experiment ${e.id}: steps point at real Python lines (all input combinations)`, () => {
      const params = e.params ?? []
      const combos: Record<string, number>[] = [Object.fromEntries(params.map((p) => [p.key, p.default]))]
      for (const p of params) for (const o of p.options ?? []) combos.push({ ...combos[0], [p.key]: o.value })
      for (const c of combos) {
        const steps = e.run(c)
        checkSteps(steps, e.file)
        for (const s of steps) if (s.row) expect(s.row.length).toBe(e.columns.length)
      }
    })
  }
  it('lesson checks have a valid answer', () => {
    for (const l of lab.lessons) if (l.check) expect(l.check.answer).toBeLessThan(l.check.options.length)
  })
})

describe('math helpers', () => {
  it('eigSym matches a known symmetric matrix', () => {
    const { vals } = eigSym([
      [2, 1],
      [1, 3],
    ])
    expect(vals[0]).toBeCloseTo(3.618034, 5)
    expect(vals[1]).toBeCloseTo(1.381966, 5)
  })
  it('erf and lgamma', () => {
    expect(erf(1 / Math.SQRT2)).toBeCloseTo(0.682689, 5)
    expect(lgamma(5)).toBeCloseTo(Math.log(24), 8)
  })
})

let python = true
try {
  execFileSync('python3', ['-c', 'import numpy'])
} catch {
  python = false
}
describe.skipIf(!python)('practice solutions (run with python3)', () => {
  for (const lab of LABS)
    for (const p of lab.practice)
      it(`${lab.slug}/${p.id} prints what the page says`, () => {
        const out = execFileSync('python3', ['-c', p.solution], { encoding: 'utf8' }).replace(/\n$/, '')
        expect(out).toBe(p.expect)
      })
})
