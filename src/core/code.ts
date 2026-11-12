// The Python files in /python are the single source of truth for the code shown in the lab.
const sources = import.meta.glob('../../python/lab*/*.py', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export function fullSource(file: string): string {
  const key = `../../python/${file}`
  const src = sources[key]
  if (src == null) throw new Error(`missing python source: ${file}`)
  return src
}

/** The part of the file shown on the bench: everything above the self-check block. */
export function codeLines(file: string): string[] {
  const src = fullSource(file)
  const cut = src.indexOf('if __name__ == "__main__":')
  const body = (cut >= 0 ? src.slice(0, cut) : src).replace(/\s+$/, '')
  return body.split('\n')
}

/** Index of the first line containing the snippet, or -1. */
export function findLine(lines: string[], snippet?: string): number {
  if (!snippet) return -1
  return lines.findIndex((l) => l.includes(snippet))
}

const KW = new Set('def return for in if else elif while import from as assert lambda not and or None True False yield class with pass break continue'.split(' '))

export type Tok = { t: string; c?: 'kw' | 'num' | 'str' | 'cmt' | 'fn' | 'np' }

/** A tiny Python highlighter: enough for short, clean lab code. */
export function tokenize(line: string): Tok[] {
  const out: Tok[] = []
  const re = /(#.*$)|("""[^]*?"""|"[^"]*"|'[^']*'|f"[^"]*")|(\b\d+(?:\.\d+)?(?:e-?\d+)?\b)|(\bnp\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|(.)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ t: m[1], c: 'cmt' })
    else if (m[2]) out.push({ t: m[2], c: 'str' })
    else if (m[3]) out.push({ t: m[3], c: 'num' })
    else if (m[4]) out.push({ t: m[4], c: 'np' })
    else if (m[5]) out.push({ t: m[5], c: KW.has(m[5]) ? 'kw' : 'fn' })
    else if (m[6]) out.push({ t: m[6], c: KW.has(m[6]) ? 'kw' : undefined })
    else out.push({ t: m[0] })
  }
  // docstring lines that open and close on different lines are rare here; treat lone """ lines as strings
  return out
}
