import type { V3 } from './types'

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const len = (a: V3) => Math.sqrt(dot(a, a))
export const unit = (a: V3): V3 => {
  const l = len(a)
  return l < 1e-12 ? [0, 0, 0] : mul(a, 1 / l)
}
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** Format a number for display: fixed decimals, no "-0.00". */
export function fmt(x: number, d = 2): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : 'nan'
  const s = x.toFixed(d)
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s
}
export const fmtV = (v: number[], d = 2) => `[${v.map((x) => fmt(x, d)).join(', ')}]`

/** Row-major 3x3 matrix times vector. */
export const mv3 = (m: number[], v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
]
export const det3 = (m: number[]) =>
  m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6])
export const cols3 = (m: number[]): [V3, V3, V3] => [
  [m[0], m[3], m[6]],
  [m[1], m[4], m[7]],
  [m[2], m[5], m[8]],
]
export const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

/** Deterministic random numbers (mulberry32), so every run of a lab looks the same. */
export function rng(seed: number) {
  let a = (seed >>> 0) + 0x6d2b79f5
  const uniform = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => {
    const u = 1 - uniform()
    const v = uniform()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const int = (lo: number, hi: number) => lo + Math.floor(uniform() * (hi - lo))
  return { uniform, normal, int }
}

export const linspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
export const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
export const mean = (xs: number[]) => sum(xs) / xs.length

/** Eigen-decomposition of a symmetric matrix by Jacobi rotations. Returns columns as vectors, sorted big to small. */
export function eigSym(A: number[][]): { vals: number[]; vecs: number[][] } {
  const n = A.length
  const a = A.map((r) => [...r])
  const v: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] ** 2
    if (off < 1e-20) break
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c
        for (let k = 0; k < n; k++) {
          const akp = a[k][p]
          const akq = a[k][q]
          a[k][p] = c * akp - s * akq
          a[k][q] = s * akp + c * akq
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k]
          const aqk = a[q][k]
          a[p][k] = c * apk - s * aqk
          a[q][k] = s * apk + c * aqk
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k][p]
          const vkq = v[k][q]
          v[k][p] = c * vkp - s * vkq
          v[k][q] = s * vkp + c * vkq
        }
      }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j][j] - a[i][i])
  return { vals: order.map((i) => a[i][i]), vecs: order.map((i) => v.map((row) => row[i])) }
}

/** Error function (Abramowitz-Stegun 7.1.26), accurate to ~1e-7. */
export function erf(x: number) {
  const s = Math.sign(x)
  x = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * x)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return s * y
}
export const normalPdf = (x: number, mu = 0, sd = 1) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))
export const normalCdf = (x: number, mu = 0, sd = 1) => 0.5 * (1 + erf((x - mu) / (sd * Math.SQRT2)))

export function lgamma(x: number): number {
  // Lanczos approximation
  const g = 7
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x)
  x -= 1
  let s = c[0]
  for (let i = 1; i < g + 2; i++) s += c[i] / (x + i)
  const t = x + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(s)
}
export const betaPdf = (p: number, a: number, b: number) =>
  p <= 0 || p >= 1 ? 0 : Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + (a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p))
export function comb(n: number, k: number) {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return r
}
export const binomPmf = (n: number, k: number, p: number) => comb(n, k) * p ** k * (1 - p) ** (n - k)
export const poissonPmf = (k: number, lam: number) => Math.exp(-lam + k * Math.log(lam) - lgamma(k + 1))

/** Points of a curve z = f(x) in the vertical plane y = y0. */
export function curve(f: (x: number) => number, x0: number, x1: number, n = 120, y0 = 0): V3[] {
  return linspace(x0, x1, n).map((x) => [x, y0, f(x)] as V3)
}
/** A circle or ellipse on the table: center c, axes u and v. */
export function ring(c: V3, u: V3, v: V3, n = 96): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n
    return add(c, add(mul(u, Math.cos(t)), mul(v, Math.sin(t))))
  })
}
