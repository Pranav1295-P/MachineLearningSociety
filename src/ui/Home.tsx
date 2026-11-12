import { useMemo, type CSSProperties } from 'react'
import { SOCIETY, TAGLINE } from '../brand'
import { normalPdf, ring } from '../core/math'
import type { Prim } from '../core/types'
import { LABS } from '../labs'
import { Stage } from '../stage/Stage'
import { useDone } from './pages'

function heroScene(): Prim[] {
  const bell = (x: number, y: number) => 9 * normalPdf(x + 2.6, 0, 1) * normalPdf(y - 2.2, 0, 1)
  const bowl = (x: number, y: number) => 0.12 * ((x - 2.6) ** 2 + 2 * (y + 2.2) ** 2)
  return [
    { id: 'a', k: 'arrow', to: [2.6, 1.8, 2.4], color: '#52e3c2', label: 'v' },
    { id: 'b', k: 'arrow', to: [-1.2, 3, 1.6], color: '#ff8fb1', label: 'w' },
    { id: 'c', k: 'arrow', to: [1.4, 4.8, 4], color: '#ffd23f', label: 'v + w' },
    { id: 'bell', k: 'surface', f: bell, range: [-5.6, 0.4, -0.8, 5.2], color: '#ff8fb1', opacity: 0.85, seg: 48 },
    { id: 'bowl', k: 'surface', f: bowl, range: [0, 5.4, -5, 0.6], color: '#ffb547', opacity: 0.85, seg: 40 },
    { id: 'ball', k: 'point', p: [3.6, -1.6, bowl(3.6, -1.6) + 0.15], color: '#ffffff', r: 0.16 },
    { id: 'ring', k: 'line', pts: ring([2.6, -2.2, 0.02], [1.6, 0, 0], [0, 1.13, 0]), color: '#ffb547', opacity: 0.6 },
  ]
}

const SESSION = [
  ['Theory', 'Guided lessons on the 3D bench. Every idea is shown moving, with the ML use beside it.'],
  ['Experiments', 'Lab records: aim, apparatus, NumPy code from scratch with the running line lit, an observation table, result and viva.'],
  ['Workbench', 'An open bench. Change matrices, distributions or optimisers and see the result at once.'],
  ['Practice', 'Short coding problems with hints and tested solutions.'],
  ['Reference', 'The formula sheet: maths, NumPy and where ML uses each idea.'],
]

export function Home() {
  const scene = useMemo(heroScene, [])
  const { done } = useDone()
  return (
    <div className="home">
      <section className="home-top">
        <div className="home-copy">
          <p className="eyebrow">{SOCIETY}</p>
          <h1>{TAGLINE}</h1>
          <p className="lede">
            Three labs for the maths behind machine learning. You watch each algorithm run on a 3D lab bench, line by line, next to the NumPy code that does it, written from scratch.
          </p>
        </div>
        <div className="home-scene" aria-hidden>
          <Stage prims={scene} view={{ pos: [9, -11, 7.5], target: [0, 0, 1] }} axes={false} autoRotate hint={false} />
        </div>
      </section>

      <div className="lab-cards">
        {LABS.map((l) => {
          const total = l.lessons.length + l.experiments.length
          const seen = done.filter((d) => d.startsWith(`${l.slug}/t/`) || d.startsWith(`${l.slug}/e/`)).length
          return (
            <a key={l.slug} className="lab-card" href={`#/${l.slug}/theory`} style={{ '--signal': l.accent } as CSSProperties}>
              <span className="room">
                Lab {l.no} · Room {l.room}
              </span>
              <h2>{l.name}</h2>
              <p className="tagline">{l.tagline}</p>
              <p>{l.blurb}</p>
              <span className="card-meta">
                {l.lessons.length} lessons · {l.experiments.length} experiments · {l.practice.length} problems
              </span>
              <span className="meter" aria-label={`${seen} of ${total} lessons and experiments finished`}>
                <i style={{ width: `${(seen / total) * 100}%` }} />
              </span>
              <span className="board-cta">Enter the lab →</span>
            </a>
          )
        })}
      </div>

      <section className="session">
        <h2>How a lab session runs</h2>
        <ol>
          {SESSION.map(([t, d]) => (
            <li key={t}>
              <b>{t}</b>
              <span>{d}</span>
            </li>
          ))}
        </ol>
        <p className="muted small">
          Keys: <kbd>←</kbd> <kbd>→</kbd> step, <kbd>space</kbd> play or pause. Drag the bench to look around. All Python lives in <code>python/</code>; run it with <code>npm run py</code>.
        </p>
      </section>
    </div>
  )
}
