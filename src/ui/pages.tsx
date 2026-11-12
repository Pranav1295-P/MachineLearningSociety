import { useEffect, useMemo, useState } from 'react'
import { fullSource } from '../core/code'
import { Rich, Tex } from '../core/rich'
import type { Check, Experiment, LabDef, Lesson } from '../core/types'
import { Stage } from '../stage/Stage'
import { VIEWS } from '../stage/Stage'
import { Board, CodePanel, ObservationTable, Transport, usePlayer, Watch } from './player'

export const TABS = [
  { id: 'theory', label: 'Theory' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'workbench', label: 'Workbench' },
  { id: 'practice', label: 'Practice' },
  { id: 'reference', label: 'Reference' },
]

/* ---------- progress (per viewer, best effort) ---------- */
const KEY = 'mls-progress'
function readDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
export function useDone() {
  const [done, setDone] = useState<string[]>(readDone)
  const mark = (id: string) =>
    setDone((d) => {
      if (d.includes(id)) return d
      const n = [...d, id]
      try {
        localStorage.setItem(KEY, JSON.stringify(n))
      } catch {
        /* storage blocked: progress just isn't remembered */
      }
      return n
    })
  return { done, mark }
}

function CheckCard({ c }: { c: Check }) {
  const [pick, setPick] = useState<number | null>(null)
  const right = pick === c.answer
  return (
    <section className="panel check">
      <h3>Check yourself</h3>
      <Rich text={c.q} />
      <div className="opts">
        {c.options.map((o, i) => (
          <button key={i} className={pick === i ? (right ? 'right' : 'wrong') : ''} onClick={() => setPick(i)}>
            <Rich text={o} />
          </button>
        ))}
      </div>
      {pick != null && (
        <div className={`verdict ${right ? 'ok' : 'no'}`} aria-live="polite">
          <b>{right ? 'Correct.' : 'Not quite.'}</b> {right && <Rich text={c.why} />}
          {!right && <span> Look at the stage again and try another option.</span>}
        </div>
      )}
    </section>
  )
}

/* ---------- Theory ---------- */
function LessonView({ lab, lesson, onDone }: { lab: LabDef; lesson: Lesson; onDone: () => void }) {
  const steps = useMemo(() => lesson.steps(), [lesson])
  const pl = usePlayer(steps, lesson.id)
  useEffect(() => {
    if (pl.idx === pl.last) onDone()
  }, [pl.idx, pl.last, onDone])
  return (
    <>
      <div className="stagecard">
        <Stage prims={pl.step.scene} view={pl.step.view ?? VIEWS.iso} accent={lab.accent} legend={pl.step.legend} table={pl.step.table ?? true} />
        <Board pl={pl} label={`theory · ${lesson.title}`} />
        <Transport pl={pl} />
      </div>
      <aside className="side">
        {lesson.formula && (
          <section className="panel formula">
            <h3>Key formula</h3>
            <Tex tex={lesson.formula} block />
          </section>
        )}
        <section className="panel ml">
          <h3>Where ML uses this</h3>
          <Rich text={lesson.ml} />
        </section>
        {lesson.check && <CheckCard key={lesson.id} c={lesson.check} />}
      </aside>
    </>
  )
}

export function TheoryPage({ lab, sub }: { lab: LabDef; sub?: string }) {
  const lesson = lab.lessons.find((l) => l.id === sub) ?? lab.lessons[0]
  const { done, mark } = useDone()
  const onDone = useMemo(() => () => mark(`${lab.slug}/t/${lesson.id}`), [lab.slug, lesson.id, mark])
  return (
    <div className="lab-grid">
      <nav className="rail" aria-label="Lessons">
        <h2>Theory</h2>
        <p className="muted small">Read the board, press ▶ or →, and watch the bench.</p>
        <ol className="list">
          {lab.lessons.map((l, i) => (
            <li key={l.id}>
              <a href={`#/${lab.slug}/theory/${l.id}`} className={l.id === lesson.id ? 'on' : ''} aria-current={l.id === lesson.id ? 'page' : undefined}>
                <span className="no">{lab.no}.{i + 1}</span>
                <span>
                  <b>{l.title}</b>
                  <small>{l.short}</small>
                </span>
                {done.includes(`${lab.slug}/t/${l.id}`) && <i className="tick" aria-label="seen" />}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <LessonView key={lesson.id} lab={lab} lesson={lesson} onDone={onDone} />
    </div>
  )
}

/* ---------- Experiments: the lab record ---------- */
function ParamPanel({ exp, values, set }: { exp: Experiment; values: Record<string, number>; set: (k: string, v: number) => void }) {
  if (!exp.params?.length) return null
  return (
    <section className="params">
      <h3>Inputs</h3>
      {exp.params.map((p) => (
        <label key={p.key}>
          <span>{p.label}</span>
          {p.options ? (
            <select value={values[p.key]} onChange={(e) => set(p.key, +e.target.value)}>
              {p.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              value={values[p.key]}
              min={p.min}
              max={p.max}
              step={p.step ?? 1}
              onChange={(e) => {
                const v = +e.target.value
                if (Number.isFinite(v)) set(p.key, Math.min(p.max ?? Infinity, Math.max(p.min ?? -Infinity, v)))
              }}
            />
          )}
        </label>
      ))}
    </section>
  )
}

function Record({ exp }: { exp: Experiment }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="panel record">
      <h3>Result</h3>
      <Rich text={exp.result} />
      <h4 className="sub">Viva voce</h4>
      <ul className="viva">
        {exp.viva.map((v, i) => (
          <li key={i}>
            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <Rich text={v.q} />
            </button>
            {open === i && <Rich text={v.a} className="ans" />}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ExperimentBench({ lab, exp, done, mark }: { lab: LabDef; exp: Experiment; done: string[]; mark: (id: string) => void }) {
  const defaults = useMemo(() => Object.fromEntries((exp.params ?? []).map((p) => [p.key, p.default])), [exp])
  const [vals, setVals] = useState<Record<string, number>>(defaults)
  const steps = useMemo(() => exp.run(vals), [exp, vals])
  const pl = usePlayer(steps, `${exp.id}:${JSON.stringify(vals)}`)
  const [tab, setTab] = useState<'code' | 'aim'>('code')
  const doneId = `${lab.slug}/e/${exp.id}`
  useEffect(() => {
    if (pl.idx === pl.last) mark(doneId)
  }, [pl.idx, pl.last, doneId, mark])
  const no = lab.experiments.indexOf(exp) + 1
  return (
    <div className="lab-grid exp-grid">
      <nav className="rail" aria-label="Experiments">
        <h2>Experiments</h2>
        <p className="muted small">Each one is a lab record: aim, procedure (real NumPy code), observations, result and viva.</p>
        <ol className="list">
          {lab.experiments.map((e, i) => (
            <li key={e.id}>
              <a href={`#/${lab.slug}/experiments/${e.id}`} className={e.id === exp.id ? 'on' : ''} aria-current={e.id === exp.id ? 'page' : undefined}>
                <span className="no">
                  {lab.no}.{i + 1}
                </span>
                <span>
                  <b>{e.title}</b>
                  <small>{e.short}</small>
                </span>
                {done.includes(`${lab.slug}/e/${e.id}`) && <i className="tick" aria-label="completed" />}
              </a>
            </li>
          ))}
        </ol>
        {!!exp.params?.length && (
          <>
            <ParamPanel exp={exp} values={vals} set={(k, v) => setVals({ ...vals, [k]: v })} />
            <button className="ghost full" onClick={() => setVals(defaults)}>
              Reset inputs
            </button>
          </>
        )}
      </nav>
      <div className="stagecard">
        <div className="aim-strip">
          <span className="exp-no">
            Exp {lab.no}.{no}
          </span>
          <span className="aim-text">
            <b>Aim:</b> <Rich text={exp.aim} className="inline" />
          </span>
        </div>
        <Stage prims={pl.step.scene} view={pl.step.view ?? VIEWS.iso} accent={lab.accent} legend={pl.step.legend} table={pl.step.table ?? true} />
        <Board pl={pl} />
        <Transport pl={pl} />
      </div>
      <aside className="side">
        <div className="side-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'code'} className={tab === 'code' ? 'on' : ''} onClick={() => setTab('code')}>
            Procedure &amp; observations
          </button>
          <button role="tab" aria-selected={tab === 'aim'} className={tab === 'aim' ? 'on' : ''} onClick={() => setTab('aim')}>
            Theory &amp; viva
          </button>
        </div>
        {tab === 'code' ? (
          <>
            <CodePanel file={exp.file} line={pl.step.line} />
            <Watch pl={pl} />
            <ObservationTable pl={pl} columns={exp.columns} />
            {pl.idx === pl.last && <Record exp={exp} />}
          </>
        ) : (
          <>
            <section className="panel">
              <h3>Apparatus</h3>
              <ul className="apparatus">
                {exp.apparatus.map((a) => (
                  <li key={a}>
                    <Rich text={a} className="inline" />
                  </li>
                ))}
              </ul>
              <h4 className="sub">Theory</h4>
              <Rich text={exp.theory} />
              <h4 className="sub">Where ML uses this</h4>
              <Rich text={exp.ml} />
            </section>
            <Record exp={exp} />
            <section className="panel">
              <h3>Run it yourself</h3>
              <p className="small muted">
                The full file, with a self-check against NumPy, is <code>python/{exp.file}</code>. Run every experiment with <code>npm run py</code>.
              </p>
              <details>
                <summary>Show the full file</summary>
                <pre className="code plain">{fullSource(exp.file)}</pre>
              </details>
            </section>
          </>
        )}
      </aside>
    </div>
  )
}

export function ExperimentsPage({ lab, sub }: { lab: LabDef; sub?: string }) {
  const exp = lab.experiments.find((e) => e.id === sub) ?? lab.experiments[0]
  const { done, mark } = useDone()
  return <ExperimentBench key={exp.id} lab={lab} exp={exp} done={done} mark={mark} />
}

/* ---------- Practice ---------- */
export function PracticePage({ lab }: { lab: LabDef }) {
  const { done, mark } = useDone()
  const [open, setOpen] = useState<Record<string, number>>({})
  const solved = lab.practice.filter((p) => done.includes(`${lab.slug}/p/${p.id}`)).length
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Lab {lab.no} · Practice</p>
        <h1>Write it yourself</h1>
        <p>Short NumPy problems. Try each one in a notebook first, then open a hint, and only then the solution. Every solution here runs and prints what is shown.</p>
        <div className="progress" aria-label={`${solved} of ${lab.practice.length} marked solved`}>
          <i style={{ width: `${(solved / lab.practice.length) * 100}%` }} />
          <span>
            {solved} / {lab.practice.length} solved
          </span>
        </div>
      </header>
      <ol className="problems">
        {lab.practice.map((p, i) => {
          const o = open[p.id] ?? 0
          const isDone = done.includes(`${lab.slug}/p/${p.id}`)
          return (
            <li key={p.id} className={`problem ${isDone ? 'done' : ''}`}>
              <header>
                <span className="no">
                  P{lab.no}.{i + 1}
                </span>
                <h2>{p.title}</h2>
                <span className={`chip lvl-${p.level.replace(/\W/g, '')}`}>{p.level}</span>
              </header>
              <Rich text={p.prompt} />
              {p.ml && <p className="ml-note">In ML: {p.ml}</p>}
              {p.hints.slice(0, Math.min(o, p.hints.length)).map((h, j) => (
                <div key={j} className="hint">
                  <b>Hint {j + 1}.</b> <Rich text={h} className="inline" />
                </div>
              ))}
              {o > p.hints.length && (
                <div className="solution">
                  <pre className="code plain">{p.solution}</pre>
                  <p className="small muted">Prints:</p>
                  <pre className="code plain out">{p.expect}</pre>
                </div>
              )}
              <div className="row-btns">
                {o < p.hints.length && (
                  <button className="ghost" onClick={() => setOpen({ ...open, [p.id]: o + 1 })}>
                    Show hint {o + 1}
                  </button>
                )}
                {o <= p.hints.length && (
                  <button className="ghost" onClick={() => setOpen({ ...open, [p.id]: p.hints.length + 1 })}>
                    Show solution
                  </button>
                )}
                <label className="mark">
                  <input type="checkbox" checked={isDone} onChange={() => mark(`${lab.slug}/p/${p.id}`)} disabled={isDone} /> I solved it
                </label>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------- Reference ---------- */
export function ReferencePage({ lab }: { lab: LabDef }) {
  return (
    <div className="page wide">
      <header className="page-head">
        <p className="eyebrow">Lab {lab.no} · Reference</p>
        <h1>{lab.name}: formula sheet</h1>
        <p>Every idea in this lab, its formula, the NumPy you would actually write, and where it shows up in machine learning.</p>
      </header>
      {lab.reference.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          <div className="table-scroll">
            <table className="ref">
              <thead>
                <tr>
                  <th>Idea</th>
                  <th>Formula</th>
                  <th>NumPy</th>
                  <th>In ML</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.name}>
                    <th scope="row">{r.name}</th>
                    <td>
                      <Tex tex={r.tex} />
                    </td>
                    <td>
                      <code>{r.numpy}</code>
                    </td>
                    <td>{r.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
