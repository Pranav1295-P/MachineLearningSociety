import { useMemo, useState } from 'react'
import { betaPdf, binomPmf, eigSym, fmt, linspace, normalPdf, poissonPmf, rng } from '../../core/math'
import { Rich } from '../../core/rich'
import type { Prim, V3 } from '../../core/types'
import { Stage } from '../../stage/Stage'
import { C } from '../colors'

type R = ReturnType<typeof rng>
function gamma(r: R, k: number): number {
  // Marsaglia–Tsang
  if (k < 1) return gamma(r, k + 1) * Math.pow(r.uniform(), 1 / k)
  const d = k - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x: number
    let v: number
    do {
      x = r.normal()
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = r.uniform()
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

type Dist = {
  name: string
  discrete: boolean
  params: { key: string; label: string; min: number; max: number; step: number; def: number }[]
  support: (p: Record<string, number>) => [number, number]
  f: (x: number, p: Record<string, number>) => number
  mean: (p: Record<string, number>) => number
  var: (p: Record<string, number>) => number
  sample: (r: R, p: Record<string, number>) => number
  numpy: (p: Record<string, number>) => string
  note: string
}

const DISTS: Dist[] = [
  {
    name: 'Bernoulli',
    discrete: true,
    params: [{ key: 'p', label: 'p', min: 0.01, max: 0.99, step: 0.01, def: 0.3 }],
    support: () => [0, 1],
    f: (x, p) => (x === 1 ? p.p : 1 - p.p),
    mean: (p) => p.p,
    var: (p) => p.p * (1 - p.p),
    sample: (r, p) => (r.uniform() < p.p ? 1 : 0),
    numpy: (p) => `rng.binomial(1, ${p.p}, size=n)`,
    note: 'One yes/no trial. Binary labels, clicks, a single dropout unit.',
  },
  {
    name: 'Binomial',
    discrete: true,
    params: [
      { key: 'n', label: 'n (trials)', min: 1, max: 30, step: 1, def: 10 },
      { key: 'p', label: 'p', min: 0.01, max: 0.99, step: 0.01, def: 0.3 },
    ],
    support: (p) => [0, p.n],
    f: (x, p) => binomPmf(p.n, x, p.p),
    mean: (p) => p.n * p.p,
    var: (p) => p.n * p.p * (1 - p.p),
    sample: (r, p) => {
      let k = 0
      for (let i = 0; i < p.n; i++) if (r.uniform() < p.p) k++
      return k
    },
    numpy: (p) => `rng.binomial(${p.n}, ${p.p}, size=n)`,
    note: 'Successes in n independent trials. Correct answers on a test set, conversions in an A/B test.',
  },
  {
    name: 'Poisson',
    discrete: true,
    params: [{ key: 'lam', label: 'λ (rate)', min: 0.2, max: 12, step: 0.1, def: 3 }],
    support: (p) => [0, Math.ceil(p.lam + 4 * Math.sqrt(p.lam) + 3)],
    f: (x, p) => poissonPmf(x, p.lam),
    mean: (p) => p.lam,
    var: (p) => p.lam,
    sample: (r, p) => {
      const L = Math.exp(-p.lam)
      let k = 0
      let q = 1
      do {
        k++
        q *= r.uniform()
      } while (q > L)
      return k - 1
    },
    numpy: (p) => `rng.poisson(${p.lam}, size=n)`,
    note: 'Counts of independent events at a constant rate. Mean equals variance.',
  },
  {
    name: 'Geometric',
    discrete: true,
    params: [{ key: 'p', label: 'p', min: 0.05, max: 0.95, step: 0.01, def: 0.25 }],
    support: (p) => [1, Math.min(40, Math.ceil(Math.log(0.003) / Math.log(1 - p.p)))],
    f: (x, p) => (1 - p.p) ** (x - 1) * p.p,
    mean: (p) => 1 / p.p,
    var: (p) => (1 - p.p) / p.p ** 2,
    sample: (r, p) => Math.ceil(Math.log(1 - r.uniform()) / Math.log(1 - p.p)),
    numpy: (p) => `rng.geometric(${p.p}, size=n)`,
    note: 'Number of trials until the first success. Memoryless, like its continuous cousin the exponential.',
  },
  {
    name: 'Uniform',
    discrete: false,
    params: [
      { key: 'a', label: 'a', min: -5, max: 4, step: 0.1, def: -2 },
      { key: 'b', label: 'b', min: -4, max: 5, step: 0.1, def: 2 },
    ],
    support: (p) => [Math.min(p.a, p.b) - 1, Math.max(p.a, p.b) + 1],
    f: (x, p) => {
      const lo = Math.min(p.a, p.b)
      const hi = Math.max(p.a, p.b) + 1e-9
      return x >= lo && x <= hi ? 1 / (hi - lo) : 0
    },
    mean: (p) => (p.a + p.b) / 2,
    var: (p) => (p.b - p.a) ** 2 / 12,
    sample: (r, p) => p.a + (p.b - p.a) * r.uniform(),
    numpy: (p) => `rng.uniform(${p.a}, ${p.b}, size=n)`,
    note: 'Every value in [a, b] equally likely. The raw material for every other sampler.',
  },
  {
    name: 'Normal',
    discrete: false,
    params: [
      { key: 'mu', label: 'μ', min: -3, max: 3, step: 0.1, def: 0 },
      { key: 'sd', label: 'σ', min: 0.2, max: 3, step: 0.05, def: 1 },
    ],
    support: (p) => [p.mu - 4 * p.sd, p.mu + 4 * p.sd],
    f: (x, p) => normalPdf(x, p.mu, p.sd),
    mean: (p) => p.mu,
    var: (p) => p.sd ** 2,
    sample: (r, p) => p.mu + p.sd * r.normal(),
    numpy: (p) => `rng.normal(${p.mu}, ${p.sd}, size=n)`,
    note: 'The bell curve. Sums of many small effects; the noise model behind MSE.',
  },
  {
    name: 'Exponential',
    discrete: false,
    params: [{ key: 'lam', label: 'λ (rate)', min: 0.2, max: 4, step: 0.05, def: 1 }],
    support: (p) => [0, 6 / p.lam],
    f: (x, p) => (x < 0 ? 0 : p.lam * Math.exp(-p.lam * x)),
    mean: (p) => 1 / p.lam,
    var: (p) => 1 / p.lam ** 2,
    sample: (r, p) => -Math.log(1 - r.uniform()) / p.lam,
    numpy: (p) => `rng.exponential(${fmt(1 / p.lam, 3)}, size=n)  # scale = 1/λ`,
    note: 'Waiting time between Poisson events. Sampled in Experiment 2.2 by inverting its CDF.',
  },
  {
    name: 'Beta',
    discrete: false,
    params: [
      { key: 'a', label: 'a', min: 0.3, max: 20, step: 0.1, def: 2 },
      { key: 'b', label: 'b', min: 0.3, max: 20, step: 0.1, def: 5 },
    ],
    support: () => [0, 1],
    f: (x, p) => betaPdf(Math.min(0.999, Math.max(0.001, x)), p.a, p.b),
    mean: (p) => p.a / (p.a + p.b),
    var: (p) => (p.a * p.b) / ((p.a + p.b) ** 2 * (p.a + p.b + 1)),
    sample: (r, p) => {
      const x = gamma(r, p.a)
      return x / (x + gamma(r, p.b))
    },
    numpy: (p) => `rng.beta(${p.a}, ${p.b}, size=n)`,
    note: 'A distribution over probabilities. The posterior of a coin\'s bias (Experiment 2.6).',
  },
]

function Slider({ label, value, min, max, step, set }: { label: string; value: number; min: number; max: number; step: number; set: (v: number) => void }) {
  return (
    <label className="slider">
      {label}
      <output>{fmt(value, step < 1 ? 2 : 0)}</output>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  )
}

function DistBench() {
  const [di, setDi] = useState(1)
  const d = DISTS[di]
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(d.params.map((q) => [q.key, q.def])))
  const [n, setN] = useState(500)
  const [seed, setSeed] = useState(1)
  const p = vals
  const [lo, hi] = d.support(p)
  const samples = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: n }, () => d.sample(r, p))
  }, [d, p, n, seed])
  const sm = samples.reduce((a, b) => a + b, 0) / n
  const sv = samples.reduce((a, b) => a + (b - sm) ** 2, 0) / n
  const prims = useMemo(() => {
    const span = hi - lo
    const X = (x: number) => -5 + ((x - lo) / span) * 10
    const out: Prim[] = []
    if (d.discrete) {
      const ks = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
      const peak = Math.max(...ks.map((k) => d.f(k, p)))
      const hs = 3.4 / Math.max(peak, 1e-9)
      const w = Math.min(0.8, (10 / ks.length) * 0.4)
      const counts = new Map<number, number>()
      for (const s of samples) counts.set(s, (counts.get(s) ?? 0) + 1)
      out.push({ id: 'pmf', k: 'bars', bars: ks.map((k) => ({ x: X(k), y: -0.45, h: d.f(k, p) * hs })), w, d: 0.7, color: C.r })
      out.push({ id: 'hist', k: 'bars', bars: ks.map((k) => ({ x: X(k), y: 0.45, h: ((counts.get(k) ?? 0) / n) * hs })), w, d: 0.7, color: C.a, opacity: 0.85 })
      const every = Math.ceil(ks.length / 16)
      ks.forEach((k, i) => i % every === 0 && out.push({ id: `t${k}`, k: 'label', p: [X(k), -1.6, 0], text: String(k), color: C.m }))
    } else {
      const xs = linspace(lo, hi, 200)
      const peak = Math.max(...xs.map((x) => d.f(x, p)))
      const hs = 3.4 / Math.max(peak, 1e-9)
      const nb = 30
      const bw = (hi - lo) / nb
      const counts = new Array(nb).fill(0)
      for (const s of samples) if (s >= lo && s < hi) counts[Math.floor((s - lo) / bw)]++
      out.push({ id: 'hist', k: 'bars', bars: counts.map((c, i) => ({ x: X(lo + (i + 0.5) * bw), y: 0.3, h: (c / (n * bw)) * hs })), w: (10 / nb) * 0.92, d: 0.9, color: C.a, opacity: 0.8 })
      out.push({ id: 'pdf', k: 'line', pts: xs.map((x) => [X(x), -0.4, d.f(x, p) * hs] as V3), color: C.r, w: 3.5 })
      linspace(lo, hi, 5).forEach((x, i) => out.push({ id: `t${i}`, k: 'label', p: [X(x), -1.6, 0], text: fmt(x, 1), color: C.m }))
    }
    out.push({ id: 'mean', k: 'line', pts: [[X(d.mean(p)), -1.2, 0.02], [X(d.mean(p)), 1.4, 0.02]], color: C.g, w: 3 })
    out.push({ id: 'meanl', k: 'label', p: [X(d.mean(p)), 1.9, 0.1], text: `E[X] = ${fmt(d.mean(p), 2)}`, color: C.g })
    return out
  }, [d, p, samples, n, lo, hi])

  return (
    <div className="lab-grid">
      <aside className="rail bench-controls">
        <h2>Workbench</h2>
        <p className="muted small">Pick a distribution, move its parameters, and draw samples. Gold is the exact PMF or density, blue is your sample.</p>
        <div className="chips">
          {DISTS.map((x, i) => (
            <button
              key={x.name}
              className={i === di ? 'on' : ''}
              onClick={() => {
                setDi(i)
                setVals(Object.fromEntries(x.params.map((q) => [q.key, q.def])))
              }}
            >
              {x.name}
            </button>
          ))}
        </div>
        <h3>Parameters</h3>
        {d.params.map((q) => (
          <Slider key={q.key} label={q.label} value={p[q.key]} min={q.min} max={q.max} step={q.step} set={(v) => setVals({ ...p, [q.key]: v })} />
        ))}
        <h3>Sampling</h3>
        <Slider label="sample size n" value={n} min={10} max={20000} step={10} set={setN} />
        <button className="ghost" onClick={() => setSeed((s) => s + 1)}>
          🎲 Draw a fresh sample
        </button>
      </aside>
      <div className="stagecard">
        <Stage prims={prims} view={{ pos: [0, -16.5, 7], target: [0, 0, 1.4] }} legend={[[C.r, d.discrete ? 'exact PMF' : 'exact density'], [C.a, `histogram of ${n} samples`], [C.g, 'mean']]} />
        <section className="board">
          <header>
            <span className="tone-chip">{d.name}</span>
          </header>
          <Rich text={`${d.note} With more samples the blue histogram hugs the gold shape: the law of large numbers.`} />
        </section>
      </div>
      <aside className="side">
        <section className="panel">
          <h3>Theory vs sample</h3>
          <div className="readout">
            <div>
              <b>{fmt(d.mean(p), 3)}</b>
              <span>E[X] (theory)</span>
            </div>
            <div>
              <b>{fmt(sm, 3)}</b>
              <span>sample mean</span>
            </div>
            <div>
              <b>{fmt(d.var(p), 3)}</b>
              <span>Var(X) (theory)</span>
            </div>
            <div>
              <b>{fmt(sv, 3)}</b>
              <span>sample variance</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <h3>Same thing in NumPy</h3>
          <pre className="code plain">{`rng = np.random.default_rng(${seed})
n = ${n}
x = ${d.numpy(p)}
x.mean(), x.var()   # ≈ ${fmt(sm, 3)}, ${fmt(sv, 3)}`}</pre>
        </section>
        <section className="panel bench-note">
          <h3>Try this</h3>
          <ul className="apparatus">
            <li>Binomial with n = 30, p = 0.1, then Poisson with λ = 3. Nearly the same shape. Why?</li>
            <li>Shrink n to 20 and redraw a few times. How much does the sample mean jump?</li>
            <li>Beta with a = b = 0.5: where does the probability go?</li>
            <li>Exponential: is the mean bigger or smaller than the most likely value?</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}

function GaussBench() {
  const [sx, setSx] = useState(1.5)
  const [sy, setSy] = useState(1)
  const [rho, setRho] = useState(0.6)
  const [n, setN] = useState(400)
  const S = [
    [sx * sx, rho * sx * sy],
    [rho * sx * sy, sy * sy],
  ]
  const det = S[0][0] * S[1][1] - S[0][1] ** 2
  const { vals, vecs } = eigSym(S)
  const f = useMemo(() => {
    const a = S[1][1] / det
    const b = -S[0][1] / det
    const c = S[0][0] / det
    const k = Math.exp(-Math.log(2 * Math.PI) - 0.5 * Math.log(det))
    return (x: number, y: number) => 10 * k * Math.exp(-0.5 * (a * x * x + 2 * b * x * y + c * y * y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sx, sy, rho])
  const pts = useMemo(() => {
    const r = rng(4)
    return Array.from({ length: n }, () => {
      const z1 = r.normal()
      const z2 = r.normal()
      return [sx * z1, sy * (rho * z1 + Math.sqrt(1 - rho * rho) * z2), 0.04] as V3
    })
  }, [sx, sy, rho, n])
  const prims: Prim[] = [
    { id: 's', k: 'surface', f, range: [-5, 5, -5, 5], color: C.b, opacity: 0.55, seg: 60 },
    { id: 'pts', k: 'cloud', pts, color: C.a, r: 0.05 },
    ...vecs.map((v, i) => ({ id: `e${i}`, k: 'arrow', from: [0, 0, 0.05], to: [v[0] * 2 * Math.sqrt(vals[i]), v[1] * 2 * Math.sqrt(vals[i]), 0.05], color: i ? C.v : C.r, label: `2√λ${i + 1}` }) as Prim),
  ]
  return (
    <div className="lab-grid">
      <aside className="rail bench-controls">
        <h2>Workbench</h2>
        <p className="muted small">A 2D Gaussian. Change the spreads and the correlation; the surface, the samples and the covariance eigenvectors all follow.</p>
        <Slider label="σx" value={sx} min={0.3} max={2.5} step={0.05} set={setSx} />
        <Slider label="σy" value={sy} min={0.3} max={2.5} step={0.05} set={setSy} />
        <Slider label="correlation ρ" value={rho} min={-0.95} max={0.95} step={0.01} set={setRho} />
        <Slider label="samples" value={n} min={50} max={3000} step={50} set={setN} />
      </aside>
      <div className="stagecard">
        <Stage prims={prims} view={{ pos: [6, -9, 8], target: [0, 0, 0.5] }} legend={[[C.b, 'density surface'], [C.a, 'samples'], [C.r, 'major axis'], [C.v, 'minor axis']]} />
        <section className="board">
          <header>
            <span className="tone-chip">2D Gaussian</span>
          </header>
          <Rich text={`$\\Sigma=\\begin{bmatrix}${fmt(S[0][0], 2)}&${fmt(S[0][1], 2)}\\\\${fmt(S[1][0], 2)}&${fmt(S[1][1], 2)}\\end{bmatrix}$, $\\det\\Sigma=${fmt(det, 3)}$. As $|\\rho|\\to1$ the determinant goes to 0, the ridge becomes a knife-edge and the density can no longer be normalised: the two variables carry the same information.`} />
        </section>
      </div>
      <aside className="side">
        <section className="panel">
          <h3>Covariance</h3>
          <div className="readout">
            <div>
              <b>{fmt(vals[0], 3)}</b>
              <span>λ₁ (variance along the ridge)</span>
            </div>
            <div>
              <b>{fmt(vals[1], 3)}</b>
              <span>λ₂ (across)</span>
            </div>
            <div>
              <b>{fmt(det, 3)}</b>
              <span>det Σ = λ₁λ₂</span>
            </div>
            <div>
              <b>{fmt((100 * vals[0]) / (vals[0] + vals[1]), 1)}%</b>
              <span>variance on PC1</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <h3>Same thing in NumPy</h3>
          <pre className="code plain">{`S = np.array([[${fmt(S[0][0], 3)}, ${fmt(S[0][1], 3)}],
              [${fmt(S[1][0], 3)}, ${fmt(S[1][1], 3)}]])
X = rng.multivariate_normal([0, 0], S, size=${n})
np.linalg.eigh(S)    # axes of the ellipse`}</pre>
        </section>
      </aside>
    </div>
  )
}

export function ProbWorkbench() {
  const [mode, setMode] = useState<'dist' | 'gauss'>('dist')
  return (
    <div className="bench-wrap">
      <div className="bench-switch" role="tablist">
        <button role="tab" aria-selected={mode === 'dist'} className={mode === 'dist' ? 'on' : ''} onClick={() => setMode('dist')}>
          Distribution explorer
        </button>
        <button role="tab" aria-selected={mode === 'gauss'} className={mode === 'gauss' ? 'on' : ''} onClick={() => setMode('gauss')}>
          2D Gaussian
        </button>
      </div>
      {mode === 'dist' ? <DistBench /> : <GaussBench />}
    </div>
  )
}

