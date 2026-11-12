import { useEffect, useMemo, useState } from 'react'
import { clamp, fmt } from '../../core/math'
import { Rich } from '../../core/rich'
import type { Prim, V3 } from '../../core/types'
import { Stage } from '../../stage/Stage'
import { C } from '../colors'

type Land = { name: string; f: (x: number, y: number) => number; zs: number; start: [number, number]; note: string; numpy: string }
const LANDS: Land[] = [
  { name: 'Narrow bowl', f: (x, y) => x * x + 8 * y * y, zs: 0.035, start: [-2.8, 1.2], note: 'Convex, but 8× steeper in y than in x: plain gradient descent zig-zags.', numpy: 'x**2 + 8*y**2' },
  { name: 'Rosenbrock', f: (x, y) => (1 - x) ** 2 + 5 * (y - x * x) ** 2, zs: 0.03, start: [-2, 2.5], note: 'A curved banana valley with its minimum at (1, 1). Easy to reach the valley, slow to walk along it.', numpy: '(1 - x)**2 + 5*(y - x**2)**2' },
  { name: 'Saddle', f: (x, y) => 0.5 * x * x - y * y + 0.12 * y ** 4, zs: 0.35, start: [-2.6, 0.02], note: 'A saddle at the origin with two minima at y ≈ ±2.9. Start almost exactly on the ridge and watch who escapes first.', numpy: '0.5*x**2 - y**2 + 0.12*y**4' },
  { name: 'Two wells', f: (x, y) => 0.3 * ((x * x - 4) ** 2) / 4 + 0.6 * y * y + 0.35 * x, zs: 0.4, start: [2.8, 2], note: 'Non-convex: a shallow well on the right and a deeper one on the left. Momentum can carry a ball over the bump.', numpy: '0.075*(x**2 - 4)**2 + 0.6*y**2 + 0.35*x' },
]

type Opt = 'gd' | 'mom' | 'adam'
const OPTS: { id: Opt; name: string; color: string }[] = [
  { id: 'gd', name: 'Gradient descent', color: C.w },
  { id: 'mom', name: 'Momentum (β = 0.9)', color: C.a },
  { id: 'adam', name: 'Adam', color: C.b },
]

function grad(f: Land['f'], x: number, y: number): [number, number] {
  const h = 1e-5
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)]
}

function run(land: Land, opt: Opt, lr: number, steps: number, s: [number, number]): [number, number][] {
  let [x, y] = s
  let vx = 0,
    vy = 0,
    mx = 0,
    my = 0,
    sx = 0,
    sy = 0
  const out: [number, number][] = [[x, y]]
  for (let t = 1; t <= steps; t++) {
    const [gx, gy] = grad(land.f, x, y)
    if (opt === 'gd') {
      x -= lr * gx
      y -= lr * gy
    } else if (opt === 'mom') {
      vx = 0.9 * vx + gx
      vy = 0.9 * vy + gy
      x -= lr * vx
      y -= lr * vy
    } else {
      mx = 0.9 * mx + 0.1 * gx
      my = 0.9 * my + 0.1 * gy
      sx = 0.999 * sx + 0.001 * gx * gx
      sy = 0.999 * sy + 0.001 * gy * gy
      const mhx = mx / (1 - 0.9 ** t)
      const mhy = my / (1 - 0.9 ** t)
      const shx = sx / (1 - 0.999 ** t)
      const shy = sy / (1 - 0.999 ** t)
      x -= (lr * 10 * mhx) / (Math.sqrt(shx) + 1e-8)
      y -= (lr * 10 * mhy) / (Math.sqrt(shy) + 1e-8)
    }
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 50 || Math.abs(y) > 50) break
    out.push([x, y])
  }
  return out
}

function Slider({ label, value, min, max, step, set, show }: { label: string; value: number; min: number; max: number; step: number; set: (v: number) => void; show?: string }) {
  return (
    <label className="slider">
      {label}
      <output>{show ?? fmt(value, 2)}</output>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  )
}

export function CalcWorkbench() {
  const [li, setLi] = useState(0)
  const land = LANDS[li]
  const [logLr, setLogLr] = useState(-1.7)
  const lr = 10 ** logLr
  const [start, setStart] = useState<[number, number]>(land.start)
  const [steps, setSteps] = useState(80)
  const [on, setOn] = useState<Record<Opt, boolean>>({ gd: true, mom: true, adam: true })
  const [t, setT] = useState(steps)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setT((v) => Math.min(v + 1, steps)), 50)
    return () => clearInterval(id)
  }, [playing, steps])
  useEffect(() => {
    if (playing && t >= steps) setPlaying(false)
  }, [playing, t, steps])

  const lo = useMemo(() => {
    let m = Infinity
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) m = Math.min(m, land.f(-3.3 + (6.6 * i) / 40, -3.3 + (6.6 * j) / 40))
    return m
  }, [land])
  const Z = (v: number) => clamp((v - lo) * land.zs, 0, 4.6)
  const sf = useMemo(() => (x: number, y: number) => clamp((land.f(x, y) - lo) * land.zs, 0, 4.6), [land, lo])
  const paths = useMemo(() => Object.fromEntries(OPTS.map((o) => [o.id, run(land, o.id, lr, steps, start)])) as Record<Opt, [number, number][]>, [land, lr, steps, start])
  const prims: Prim[] = [{ id: 's', k: 'surface', f: sf, range: [-3.3, 3.3, -3.3, 3.3], color: C.o, opacity: 0.72, seg: 70 }, { id: 'start', k: 'point', p: [start[0], start[1], Z(land.f(...start)) + 0.15], color: C.r, r: 0.1, label: 'start' }]
  for (const o of OPTS) {
    if (!on[o.id]) continue
    const pts = paths[o.id].slice(0, t + 1).filter(([x, y]) => Math.abs(x) < 3.4 && Math.abs(y) < 3.4)
    const v3 = pts.map(([x, y]) => [x, y, Z(land.f(x, y)) + 0.1] as V3)
    if (v3.length > 1) prims.push({ id: `p${o.id}`, k: 'line', pts: v3, color: o.color, w: 2.5 })
    if (v3.length) prims.push({ id: `b${o.id}`, k: 'point', p: v3[v3.length - 1], color: o.color, r: 0.15 })
  }
  const final = (o: Opt) => {
    const p = paths[o][Math.min(t, paths[o].length - 1)]
    return { p, L: land.f(p[0], p[1]), escaped: paths[o].length - 1 < Math.min(t, steps) }
  }

  return (
    <div className="lab-grid">
      <aside className="rail bench-controls">
        <h2>Workbench</h2>
        <p className="muted small">An optimiser race. Pick a landscape, a learning rate and a start, then play. All three optimisers start from the same point.</p>
        <h3>Landscape</h3>
        <div className="chips">
          {LANDS.map((l, i) => (
            <button
              key={l.name}
              className={i === li ? 'on' : ''}
              onClick={() => {
                setLi(i)
                setStart(l.start)
                setT(0)
                setPlaying(true)
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
        <h3>Optimisers</h3>
        {OPTS.map((o) => (
          <label key={o.id} className="toggle">
            <input type="checkbox" checked={on[o.id]} onChange={(e) => setOn({ ...on, [o.id]: e.target.checked })} />
            <i style={{ width: 14, height: 4, background: o.color, display: 'inline-block' }} /> {o.name}
          </label>
        ))}
        <h3>Settings</h3>
        <Slider label="learning rate η" value={logLr} min={-3} max={-0.3} step={0.05} set={setLogLr} show={lr.toPrecision(2)} />
        <Slider label="start x" value={start[0]} min={-3} max={3} step={0.1} set={(v) => setStart([v, start[1]])} />
        <Slider label="start y" value={start[1]} min={-3} max={3} step={0.02} set={(v) => setStart([start[0], v])} />
        <Slider label="steps" value={steps} min={10} max={300} step={10} set={(v) => (setSteps(v), setT(v))} show={String(steps)} />
        <Slider label="replay position" value={t} min={0} max={steps} step={1} set={setT} show={String(t)} />
        <button className="ghost" onClick={() => (setT(0), setPlaying(true))}>
          ▶ Race again
        </button>
      </aside>
      <div className="stagecard">
        <Stage prims={prims} view={{ pos: [7, -9.5, 8.5], target: [0, 0, 0.8] }} legend={OPTS.filter((o) => on[o.id]).map((o) => [o.color, o.name] as [string, string])} />
        <section className="board">
          <header>
            <span className="tone-chip">{land.name}</span>
          </header>
          <Rich text={`${land.note} Adam's step uses η × 10 here so all three are comparable on one slider.`} />
        </section>
      </div>
      <aside className="side">
        <section className="panel">
          <h3>After {t} steps</h3>
          <div className="readout">
            {OPTS.filter((o) => on[o.id]).map((o) => {
              const r = final(o.id)
              return (
                <div key={o.id} style={{ borderLeft: `3px solid ${o.color}` }}>
                  <b>{r.escaped ? 'diverged' : fmt(r.L, 4)}</b>
                  <span>
                    {o.name.split(' (')[0]} loss at ({fmt(r.p[0], 2)}, {fmt(r.p[1], 2)})
                  </span>
                </div>
              )
            })}
          </div>
        </section>
        <section className="panel">
          <h3>The three update rules</h3>
          <pre className="code plain">{`# gradient descent
w -= lr * g

# momentum: remember the direction
v = 0.9 * v + g
w -= lr * v

# Adam: momentum + per-weight step size
m = 0.9 * m + 0.1 * g
s = 0.999 * s + 0.001 * g**2
w -= lr * m_hat / (np.sqrt(s_hat) + 1e-8)

# this landscape
L = ${land.numpy}`}</pre>
        </section>
        <section className="panel bench-note">
          <h3>Try this</h3>
          <ul className="apparatus">
            <li>Narrow bowl: raise η until plain GD diverges. Does momentum diverge first or later?</li>
            <li>Rosenbrock: which optimiser gets to (1, 1) in 300 steps?</li>
            <li>Saddle: start at y = 0 exactly. Why does nobody move off the ridge?</li>
            <li>Two wells: find a start where GD stops in the shallow well but momentum reaches the deep one.</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}
