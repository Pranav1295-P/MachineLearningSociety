import katex from 'katex'
import { Fragment, useMemo, type ReactNode } from 'react'

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: block, strict: false }), [tex, block])
  return block ? <div className="tex-block" dangerouslySetInnerHTML={{ __html: html }} /> : <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** Inline markup: $math$, **bold**, `code`. */
function inline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\$([^$]+)\$|\*\*([^*]+)\*\*|`([^`]+)`/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const k = `${keyBase}-${i++}`
    if (m[1] != null) parts.push(<Tex key={k} tex={m[1]} />)
    else if (m[2] != null) parts.push(<b key={k}>{m[2]}</b>)
    else parts.push(<code key={k}>{m[3]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** Paragraphs split on blank lines; a paragraph that is only $$...$$ renders as display math; lines starting "- " become a list. */
export function Rich({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className={`rich ${className ?? ''}`}>
      {blocks.map((b, i) => {
        const t = b.trim()
        if (t.startsWith('$$') && t.endsWith('$$')) return <Tex key={i} tex={t.slice(2, -2)} block />
        const lines = t.split('\n')
        if (lines.every((l) => l.trim().startsWith('- ')))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          )
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
