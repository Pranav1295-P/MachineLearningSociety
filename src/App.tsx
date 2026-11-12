import { useEffect, useState, type CSSProperties } from 'react'
import { SOCIETY, TAGLINE } from './brand'
import { LABS } from './labs'
import { Home } from './ui/Home'
import { ExperimentsPage, PracticePage, ReferencePage, TABS, TheoryPage } from './ui/pages'


function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function App() {
  const [slug, tabRaw, sub] = useRoute()
  const lab = LABS.find((l) => l.slug === slug)
  const tab = TABS.some((t) => t.id === tabRaw) ? tabRaw : 'theory'
  useEffect(() => {
    document.title = lab ? `Lab ${lab.no} · ${lab.name} - ${SOCIETY}` : `${SOCIETY} - ${TAGLINE}`
  }, [lab])

  return (
    <div className="app" style={lab ? ({ '--signal': lab.accent } as CSSProperties) : undefined}>
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden />
          <span>
            <b>{SOCIETY}</b>
            <small>{TAGLINE}</small>
          </span>
        </a>
        {lab && (
          <>
            <span className="lab-tag">
              Lab {lab.no} · {lab.name}
              <small>Room {lab.room}</small>
            </span>
            <nav aria-label="Lab sections">
              {TABS.map((t) => (
                <a key={t.id} href={`#/${lab.slug}/${t.id}`} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined}>
                  {t.label}
                </a>
              ))}
            </nav>
          </>
        )}
      </header>
      <main>
        {!lab && <Home />}
        {lab && tab === 'theory' && <TheoryPage key={lab.slug} lab={lab} sub={sub} />}
        {lab && tab === 'experiments' && <ExperimentsPage key={lab.slug} lab={lab} sub={sub} />}
        {lab && tab === 'workbench' && <lab.Workbench key={lab.slug} />}
        {lab && tab === 'practice' && <PracticePage key={lab.slug} lab={lab} />}
        {lab && tab === 'reference' && <ReferencePage key={lab.slug} lab={lab} />}
      </main>
    </div>
  )
}
