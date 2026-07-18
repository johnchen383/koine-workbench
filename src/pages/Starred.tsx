import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadChapter } from '../lib/data'
import { listStars, loadDraft, toggleStar, type StarRef } from '../lib/progress'
import type { ChapterData } from '../lib/types'

const chapterKey = (book: string, chapter: number) => `${book}/${chapter}`

export default function Starred() {
  const [stars, setStars] = useState<StarRef[]>(() => listStars())
  const [chapters, setChapters] = useState<Record<string, ChapterData>>({})

  const neededChapters = useMemo(
    () => [...new Set(stars.map((s) => chapterKey(s.book, s.chapter)))],
    [stars]
  )

  useEffect(() => {
    for (const key of neededChapters) {
      if (chapters[key]) continue
      const [book, ch] = key.split('/')
      loadChapter(book, ch)
        .then((data) => setChapters((prev) => ({ ...prev, [key]: data })))
        .catch(() => {})
    }
  }, [neededChapters, chapters])

  const unstar = (s: StarRef) => {
    toggleStar(s.book, s.chapter, s.verse)
    setStars(listStars())
  }

  if (stars.length === 0) {
    return (
      <div className="starred starred--empty">
        <h1>★ Starred passages</h1>
        <p>
          Nothing starred yet. While working through a chapter, click the ☆ next to a verse
          number to mark it as difficult — it will show up here so you can come back to it.
        </p>
        <p>
          <Link to="/">Browse passages →</Link>
        </p>
      </div>
    )
  }

  // Group by chapter, canonical order; verses ordered within.
  const groups = new Map<string, StarRef[]>()
  const sorted = [...stars].sort(
    (a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse
  )
  for (const s of sorted) {
    const key = chapterKey(s.book, s.chapter)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  return (
    <div className="starred">
      <h1>★ Starred passages</h1>
      <p className="starred__intro">Verses you marked as difficult, for another pass.</p>
      {[...groups.entries()].map(([key, refs]) => {
        const chapter = chapters[key]
        return (
          <section key={key} className="starred__group">
            <h2>
              {chapter ? `${chapter.bookName} ${chapter.chapter}` : key.replace('/', ' ')}
            </h2>
            {refs.map((s) => {
              const verse = chapter?.verses.find((v) => v.v === s.verse)
              const greek = verse
                ? verse.words.map((w) => w.pp + w.g + w.pf).join(' ')
                : ''
              const draft = loadDraft(s.book, s.chapter, s.verse)
              return (
                <div key={s.verse} className="starred__item">
                  <div className="starred__item-head">
                    <Link to={`/${s.book}/${s.chapter}#v${s.verse}`} className="starred__ref">
                      {chapter?.bookName ?? s.book} {s.chapter}:{s.verse}
                    </Link>
                    <button
                      className="starred__unstar"
                      onClick={() => unstar(s)}
                      title="Remove star"
                    >
                      ★ remove
                    </button>
                  </div>
                  {greek && (
                    <p className="starred__greek" lang="grc">
                      {greek}
                    </p>
                  )}
                  {draft ? (
                    <p className="starred__draft">“{draft}”</p>
                  ) : (
                    <p className="starred__draft starred__draft--none">no draft yet</p>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
