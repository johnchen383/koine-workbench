import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { loadChapter, loadIndex } from '../lib/data'
import { analyzeVerse } from '../lib/rules'
import type { ChapterData, DataIndex } from '../lib/types'
import { VerseCard } from '../components/VerseCard'
import { WordDetail } from '../components/WordDetail'

export interface Layers {
  translit: boolean
  gloss: boolean
  parse: boolean
}

export interface Selection {
  vi: number // verse index
  wi: number // word index
}

export default function Chapter() {
  const { book = '', chapter = '' } = useParams()
  const [data, setData] = useState<ChapterData | null>(null)
  const [index, setIndex] = useState<DataIndex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [layers, setLayers] = useState<Layers>({ translit: false, gloss: false, parse: false })
  const [sel, setSel] = useState<Selection | null>(null)
  const location = useLocation()

  useEffect(() => {
    setData(null)
    setError(null)
    setSel(null)
    loadChapter(book, chapter)
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [book, chapter])

  useEffect(() => {
    loadIndex().then(setIndex).catch(() => {})
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSel(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Scroll to #v<n> once the verses have rendered (SPA navigation from Starred etc.).
  useEffect(() => {
    if (!data || !/^#v\d+$/.test(location.hash)) return
    document.querySelector(location.hash)?.scrollIntoView({ block: 'start' })
  }, [data, location.hash])

  const analyses = useMemo(
    () => (data ? data.verses.map((v) => analyzeVerse(v, data.book)) : []),
    [data]
  )

  if (error) {
    return (
      <div className="chapter">
        <p className="error">
          Could not load {book} {chapter}: {error}
        </p>
        <p>
          If this passage has not been generated yet, run{' '}
          <code>yarn pipeline {book} {chapter}</code>.
        </p>
      </div>
    )
  }
  if (!data) return <div className="chapter loading">Loading…</div>

  const chapters = index?.books[book]?.chapters ?? []
  const chNum = Number(chapter)
  const pos = chapters.indexOf(chNum)
  const prev = pos > 0 ? chapters[pos - 1] : null
  const next = pos >= 0 && pos < chapters.length - 1 ? chapters[pos + 1] : null

  const toggle = (k: keyof Layers) => setLayers((l) => ({ ...l, [k]: !l[k] }))

  return (
    <div className={`chapter ${sel ? 'chapter--panel-open' : ''}`}>
      <div className="chapter__main">
        <div className="chapter__header">
          <nav className="chapter__nav">
            {prev !== null ? <Link to={`/${book}/${prev}`}>← {prev}</Link> : <span />}
            <h1>
              {data.bookName} {data.chapter}
            </h1>
            {next !== null ? <Link to={`/${book}/${next}`}>{next} →</Link> : <span />}
          </nav>
          <div className="chapter__toolbar">
            <span className="chapter__toolbar-label">Show:</span>
            <button
              className={`toggle ${layers.translit ? 'toggle--on' : ''}`}
              onClick={() => toggle('translit')}
            >
              Transliteration
            </button>
            <button
              className={`toggle ${layers.gloss ? 'toggle--on' : ''}`}
              onClick={() => toggle('gloss')}
            >
              Glosses
            </button>
            <button
              className={`toggle ${layers.parse ? 'toggle--on' : ''}`}
              onClick={() => toggle('parse')}
            >
              Parsing
            </button>
            <span className="chapter__legend">
              <span className="legend-swatch legend-swatch--decision" /> translation decision
              (click the word) &nbsp;·&nbsp;
              <span className="legend-swatch legend-swatch--ot" /> OT quotation &nbsp;·&nbsp;
              <span className="legend-swatch legend-swatch--note" /> discussed in a note below the
              verse
            </span>
          </div>
        </div>

        {data.verses.map((verse, vi) => (
          <VerseCard
            key={`${data.book}-${data.chapter}-${verse.v}`}
            data={data}
            verse={verse}
            analysis={analyses[vi]}
            layers={layers}
            selectedWord={sel?.vi === vi ? sel.wi : null}
            onSelectWord={(wi) => setSel(sel?.vi === vi && sel.wi === wi ? null : { vi, wi })}
          />
        ))}
      </div>

      {sel && (
        <WordDetail
          data={data}
          verse={data.verses[sel.vi]}
          word={data.verses[sel.vi].words[sel.wi]}
          matches={analyses[sel.vi][sel.wi]}
          onClose={() => setSel(null)}
        />
      )}
    </div>
  )
}
