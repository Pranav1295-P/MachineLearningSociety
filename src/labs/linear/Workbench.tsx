import { useEffect, useMemo, useState } from 'react'
import { cols3, det3, fmt, fmtV, I3, mv3 } from '../../core/math'
import { Rich } from '../../core/rich'
import type { Prim, V3 } from '../../core/types'
import { Stage, VIEWS } from '../../stage/Stage'
import { C } from '../colors'

const r45 = Math.SQRT1_2
const PRESETS: [string, number[], string][] = [
  ['Identity', I3, 'Does nothing. Every column is its own axis.'],
  ['Scale', [2, 0, 0, 0, 0.5, 0, 0, 0, 1.5], 'Stretches each axis by its own amount. det = product of the diagonal.'],
  ['Shear', [1, 1, 0, 0, 1, 0.6, 0, 0, 1], 'Slides layers over each other. Volume is unchanged (det = 1).'],
  ['Rotate z 45°', [r45, -r45, 0, r45, r45, 0, 0, 0, 1], 'Spins space around the z axis. Lengths and angles are preserved.'],
  ['Reflect', [1, 0, 0, 0, -1, 0, 0, 0, 1], 'Mirrors y. det = −1: orientation flips.'],
  ['Project', [1, 0, 0, 0, 1, 0, 0, 0, 0], 'Flattens everything onto the floor. det = 0: no inverse exists.'],
  ['Symmetric', [2, 1, 0, 1, 2, 0.5, 0, 0.5, 1.5], 'A symmetric matrix: three real, perpendicular eigenvectors, like a covariance matrix.'],
]

/** Real eigenpairs of a 3x3 matrix: roots of the characteristic cubic, then a null vector of (M − λI). */
function realEigen(m: number[]): { val: number; vec: V3 }[] {
  const tr = m[0] + m[4] + m[8]
  const c2 = m[0] * m[4] - m[1] * m[3] + m[0] * m[8] - m[2] * m[6] + m[4] * m[8] - m[5] * m[7]
  const d = det3(m)
  // λ³ − tr λ² + c2 λ − d = 0  → depressed cubic t³ + pt + q with λ = t + tr/3
  const a = -tr,
    b = c2,
    c = -d
  const p = b - (a * a) / 3
  const q = (2 * a * a * a) / 27 - (a * b) / 3 + c
  const roots: number[] = []
  const disc = (q * q) / 4 + (p * p * p) / 27
  if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) roots.push(0)
  else if (disc > 1e-12) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(disc))
    const v = Math.cbrt(-q / 2 - Math.sqrt(disc))
    roots.push(u + v)
  } else {
    const r = Math.sqrt(Math.max(-p / 3, 0))
    const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r * r * r || 1))))
    for (let k = 0; k < 3; k++) roots.push(2 * r * Math.cos((phi - 2 * Math.PI * k) / 3))
  }
  const out: { val: number; vec: V3 }[] = []
  for (const t of roots) {
    const lam = t - a / 3
    if (out.some((o) => Math.abs(o.val - lam) < 1e-6)) continue
    const rows: V3[] = [
      [m[0] - lam, m[1], m[2]],
      [m[3], m[4] - lam, m[5]],
      [m[6], m[7], m[8] - lam],
    ]
    const cr = (x: V3, y: V3): V3 => [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]]
    const cands = [cr(rows[0], rows[1]), cr(rows[0], rows[2]), cr(rows[1], rows[2])]
    let best = cands.reduce((s, v) => (Math.hypot(...v) > Math.hypot(...s) ? v : s))
    let n = Math.hypot(...best)
    if (n < 1e-9) {
      // repeated eigenvalue: any vector orthogonal to a non-zero row works
      const r0 = rows.find((r) => Math.hypot(...r) > 1e-9)
      if (!r0) continue
      best = cr(r0, Math.abs(r0[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])
      n = Math.hypot(...best)
    }
    out.push({ val: lam, vec: best.map((x) => x / n) as V3 })
  }
  return out.sort((x, y) => Math.abs(y.val) - Math.abs(x.val))
}

export function LinearWorkbench() {
  const [m, setM] = useState<number[]>(PRESETS[2][1])
  const [note, setNote] = useState(PRESETS[2][2])
  const [t, setT] = useState(1)
  const [x, setX] = useState<V3>([1, 1, 1])
  const [playing, setPlaying] = useState(false)
  const [showEig, setShowEig] = useState(true)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const v = Math.min(1, (now - t0) / 1600)
      setT(v)
      if (v < 1) raf = requestAnimationFrame(tick)
      else setPlaying(false)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const mt = useMemo(() => I3.map((v, i) => v + (m[i] - v) * t), [m, t])
  const det = det3(m)
  const eig = useMemo(() => realEigen(m), [m])
  const mx = mv3(m, x)
  const prims: Prim[] = useMemo(() => {
    const [c1, c2, c3] = cols3(mt)
    const S = 1.6
    const ps: Prim[] = [
      { id: 'g', k: 'grid', m: mt, color: C.r, n: 4, opacity: 0.45 },
      { id: 'box', k: 'box', basis: [c1, c2, c3].map((c) => c.map((v) => v * S)) as [V3, V3, V3], color: Math.abs(det) < 1e-9 ? C.bad : C.r, opacity: 0.16 },
      { id: 'i', k: 'arrow', to: c1.map((v) => v * S) as V3, color: '#ff6b6b', label: 'col 1' },
      { id: 'j', k: 'arrow', to: c2.map((v) => v * S) as V3, color: '#7bed9f', label: 'col 2' },
      { id: 'k', k: 'arrow', to: c3.map((v) => v * S) as V3, color: '#70a1ff', label: 'col 3' },
      { id: 'x', k: 'arrow', to: x.map((v) => v * S) as V3, color: C.a, r: 0.035, opacity: 0.6, label: 'x' },
      { id: 'mx', k: 'arrow', to: mv3(mt, x).map((v) => v * S) as V3, color: C.b, label: 'M x' },
    ]
    if (showEig && t > 0.999)
      eig.forEach((e, i) =>
        ps.push({ id: `e${i}`, k: 'line', pts: [e.vec.map((v) => -v * 5) as V3, e.vec.map((v) => v * 5) as V3], color: C.g, dashed: true }, { id: `el${i}`, k: 'label', p: e.vec.map((v) => v * 5.3) as V3, text: `λ = ${fmt(e.val, 2)}`, color: C.g }),
      )
    return ps
  }, [mt, x, eig, showEig, t, det])

  const setCell = (i: number, v: string) => {
    const n = parseFloat(v)
    if (!Number.isFinite(n)) return
    const next = [...m]
    next[i] = n
    setM(next)
    setNote('Your own matrix.')
  }
  const numpy = `M = np.array(${JSON.stringify([m.slice(0, 3), m.slice(3, 6), m.slice(6, 9)].map((r) => r.map((v) => +v.toFixed(3))))})
x = np.array(${JSON.stringify(x)})
M @ x                  # ${fmtV(mx, 3)}
np.linalg.det(M)       # ${fmt(det, 4)}
np.linalg.eigvals(M)   # ${eig.length ? eig.map((e) => fmt(e.val, 3)).join(', ') : 'complex only'}${eig.length < 3 ? ' (+ complex pair)' : ''}`

  return (
    <div className="lab-grid">
      <aside className="rail bench-controls">
        <h2>Workbench</h2>
        <p className="muted small">Type any 3×3 matrix, or start from a preset. Drag the slider to watch space morph from I to M.</p>
        <h3>Presets</h3>
        <div className="chips">
          {PRESETS.map(([name, pm, n]) => (
            <button
              key={name}
              className={m.join() === pm.join() ? 'on' : ''}
              onClick={() => {
                setM(pm)
                setNote(n)
                setT(0)
                setPlaying(true)
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <h3>Matrix M</h3>
        <div className="mat-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {m.map((v, i) => (
            <input key={i} type="number" step={0.1} value={+v.toFixed(3)} onChange={(e) => setCell(i, e.target.value)} aria-label={`M row ${Math.floor(i / 3) + 1} column ${(i % 3) + 1}`} />
          ))}
        </div>
        <h3>Vector x</h3>
        <div className="mat-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {x.map((v, i) => (
            <input
              key={i}
              type="number"
              step={0.5}
              value={v}
              onChange={(e) => {
                const n = parseFloat(e.target.value)
                if (!Number.isFinite(n)) return
                const nx = [...x] as V3
                nx[i] = n
                setX(nx)
              }}
              aria-label={`x entry ${i + 1}`}
            />
          ))}
        </div>
        <label className="slider">
          Morph I → M
          <output>{fmt(t, 2)}</output>
          <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} />
        </label>
        <button className="ghost" onClick={() => (setT(0), setPlaying(true))}>
          ▶ Animate the transformation
        </button>
        <label className="toggle">
          <input type="checkbox" checked={showEig} onChange={(e) => setShowEig(e.target.checked)} /> Show real eigenvectors (green)
        </label>
      </aside>
      <div className="stagecard">
        <Stage prims={prims} view={VIEWS.iso} />
        <section className="board">
          <header>
            <span className="tone-chip">workbench</span>
          </header>
          <Rich text={`${note} ${Math.abs(det) < 1e-9 ? '**This matrix is singular**: the box is flat, so some directions are lost for good.' : `Volume is scaled by $|\\det M|=${fmt(Math.abs(det), 3)}$${det < 0 ? ' and orientation is flipped' : ''}.`}`} />
        </section>
      </div>
      <aside className="side">
        <section className="panel">
          <h3>Readouts</h3>
          <div className="readout">
            <div>
              <b>{fmt(det, 3)}</b>
              <span>det M (volume factor)</span>
            </div>
            <div>
              <b>{fmt(m[0] + m[4] + m[8], 3)}</b>
              <span>trace (sum of λ)</span>
            </div>
            <div>
              <b>{fmtV(mx, 2)}</b>
              <span>M x</span>
            </div>
            <div>
              <b>{Math.abs(det) < 1e-9 ? 'none' : 'exists'}</b>
              <span>inverse</span>
            </div>
          </div>
          <h4 className="sub">Real eigenvalues</h4>
          <ul className="apparatus">
            {eig.map((e, i) => (
              <li key={i}>
                <code>λ = {fmt(e.val, 3)}</code> along <code>{fmtV(e.vec, 3)}</code>
              </li>
            ))}
            {eig.length < 3 && <li className="muted">The rest are complex: M rotates those directions, so no real arrow keeps its line.</li>}
          </ul>
        </section>
        <section className="panel">
          <h3>Same thing in NumPy</h3>
          <pre className="code plain">{numpy}</pre>
        </section>
        <section className="panel bench-note">
          <h3>Try this</h3>
          <ul className="apparatus">
            <li>Pick <b>Project</b>, then set x = (0, 0, 2). Where does Mx land? Which x give Mx = 0?</li>
            <li>Make column 3 equal to column 1 + column 2. Watch det reach 0.</li>
            <li>With <b>Symmetric</b>, put x on a green line. Mx stays on that line.</li>
            <li>Rotations have only one real eigenvector (the axis). Why?</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}
