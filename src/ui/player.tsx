import { Fragment, useEffect, useMemo, useState } from 'react'
import { codeLines, findLine, tokenize } from '../core/code'
import { Rich } from '../core/rich'
import type { Step } from '../core/types'

export type Player = ReturnType<typeof usePlayer>

/** Step-through state shared by lessons and experiments: index, play/pause, speed, keyboard. */
export function usePlayer(steps: Step[], resetKey: string) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  useEffect(() => {
    setIdx(0)
    setPlaying(false)
  }, [resetKey])
  const last = steps.length - 1
  const i = Math.min(idx, last)
  useEffect(() => {
    if (!playing) return
    if (i >= last) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setIdx((x) => Math.min(x + 1, last)), 2400 / speed)
    return () => clearTimeout(t)
  }, [playing, i, speed, last])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, select, textarea')) return
      if (e.key === 'ArrowRight') setIdx((x) => Math.min(x + 1, last))
      else if (e.key === 'ArrowLeft') setIdx((x) => Math.max(x - 1, 0))
      else if (e.key === ' ' && !el.closest('button')) {
        e.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [last])
  return { idx: i, setIdx, playing, setPlaying, speed, setSpeed, step: steps[i], steps, last }
}

export function Transport({ pl }: { pl: Player }) {
  const { idx, setIdx, playing, setPlaying, speed, setSpeed, last } = pl
  return (
    <div className="transport" role="group" aria-label="Step controls">
      <button onClick={() => setIdx(0)} aria-label="First step" title="First step">
        ⏮
      </button>
      <button onClick={() => setIdx((x) => Math.max(Math.min(x, last) - 1, 0))} aria-label="Previous step" title="Previous (←)">
        ◀
      </button>
      <button
        className="play"
        onClick={() => {
          if (idx >= last) setIdx(0)
          setPlaying(!playing)
        }}
      >
        {playing ? 'Pause' : idx >= last ? 'Replay' : 'Play'}
      </button>
      <button onClick={() => setIdx((x) => Math.min(x + 1, last))} aria-label="Next step" title="Next (→)">
        ▶
      </button>
      <button onClick={() => setIdx(last)} aria-label="Last step" title="Last step">
        ⏭
      </button>
      <input type="range" min={0} max={last} value={idx} onChange={(e) => setIdx(+e.target.value)} aria-label="Scrub steps" />
      <label>
        speed
        <select value={speed} onChange={(e) => setSpeed(+e.target.value)}>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </label>
    </div>
  )
}

const TONE_NAME: Record<string, string> = { info: 'observe', make: 'compute', walk: 'iterate', warn: 'careful', done: 'result', cut: 'remove' }

export function Board({ pl, label }: { pl: Player; label?: string }) {
  const { step, idx, last } = pl
  const tone = step.tone ?? 'info'
  return (
    <section className={`board tone-${tone}`} aria-live="polite">
      <header>
        <span className="tone-chip">{label ?? TONE_NAME[tone]}</span>
        <span className="count">
          step {idx + 1} / {last + 1}
        </span>
      </header>
      <div key={idx} className="board-in">
        <h2>{step.title}</h2>
        <Rich text={step.text} />
      </div>
    </section>
  )
}

export function CodePanel({ file, line }: { file: string; line?: string }) {
  const lines = useMemo(() => codeLines(file), [file])
  const at = findLine(lines, line)
  const name = file.split('/').pop()
  useEffect(() => {
    if (at < 0) return
    document.getElementById(`ln-${at}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [at])
  return (
    <section className="panel code-panel">
      <header>
        <h3>NumPy, from scratch</h3>
        <code className="file">{name}</code>
      </header>
      <pre className="code" aria-label={`Python source ${name}`}>
        {lines.map((l, i) => (
          <div key={i} id={`ln-${i}`} className={`ln ${i === at ? 'active' : ''}`}>
            <span className="lno">{i + 1}</span>
            {tokenize(l).map((t, j) => (
              <span key={j} className={t.c}>
                {t.t}
              </span>
            ))}
            {l === '' && ' '}
          </div>
        ))}
      </pre>
    </section>
  )
}

export function Watch({ pl }: { pl: Player }) {
  const { step, steps, idx } = pl
  const prev = idx > 0 ? steps[idx - 1].vars : undefined
  if (!step.vars?.length) return null
  return (
    <section className="panel">
      <h3>Variables</h3>
      <dl className="watch">
        {step.vars.map(([k, v]) => {
          const changed = prev && prev.find(([pk]) => pk === k)?.[1] !== v
          return (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd className={changed ? 'chg' : ''}>{v}</dd>
            </Fragment>
          )
        })}
      </dl>
    </section>
  )
}

export function ObservationTable({ pl, columns }: { pl: Player; columns: string[] }) {
  const { steps, idx } = pl
  const rows = steps.slice(0, idx + 1).filter((s) => s.row)
  const lastWithRow = [...steps.slice(0, idx + 1)].reverse().find((s) => s.row)
  return (
    <section className="panel">
      <h3>Observation table</h3>
      {rows.length === 0 ? (
        <p className="muted small">Rows appear here as the experiment runs.</p>
      ) : (
        <div className="obs-scroll">
          <table className="obs">
            <thead>
              <tr>
                <th>#</th>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={i} className={s === lastWithRow ? 'hot' : ''}>
                  <td>{i + 1}</td>
                  {s.row!.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
