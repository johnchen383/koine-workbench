import { Fragment, useState } from 'react'
import type { ChapterData, Note, Verse } from '../lib/types'
import { TRANSLATION_NAMES } from '../lib/types'
import type { RuleMatch } from '../lib/rules'
import type { Layers } from '../pages/Chapter'
import { isStarred, loadDraft, loadReveal, saveDraft, saveReveal, toggleStar } from '../lib/progress'
import { NoteCard } from './NoteCard'

interface Props {
  data: ChapterData
  verse: Verse
  analysis: RuleMatch[][]
  layers: Layers
  selectedWord: number | null
  onSelectWord: (wi: number) => void
}

const noteCoversVerse = (n: Note, v: number) => v >= n.verse.start && v <= n.verse.end

export function VerseCard({ data, verse, analysis, layers, selectedWord, onSelectWord }: Props) {
  const [draft, setDraft] = useState(() => loadDraft(data.book, data.chapter, verse.v))
  const [showCompare, setShowCompare] = useState(() => loadReveal(data.book, data.chapter, verse.v))
  const [starred, setStarred] = useState(() => isStarred(data.book, data.chapter, verse.v))

  const onToggleCompare = () => {
    setShowCompare(!showCompare)
    saveReveal(data.book, data.chapter, verse.v, !showCompare)
  }

  const onToggleStar = () => setStarred(toggleStar(data.book, data.chapter, verse.v))

  const notes = data.notes.filter((n) => noteCoversVerse(n, verse.v))
  const wordHasNote = (wi: number) =>
    notes.some((n) => n.verse.start === verse.v && n.words?.includes(wi + 1))

  const onDraft = (text: string) => {
    setDraft(text)
    saveDraft(data.book, data.chapter, verse.v, text)
  }

  // Word-by-word "smooth" line assembled from OpenGNT smooth glosses.
  const smooth = verse.words
    .map((w) => (w.gloss.st && w.gloss.st !== '-' ? w.gloss.st + englishPunct(w.pf) : ''))
    .filter(Boolean)
    .join(' ')

  return (
    <article className="verse" id={`v${verse.v}`}>
      <a className="verse__num" href={`#v${verse.v}`}>
        {verse.v}
      </a>
      <button
        className={`verse__star ${starred ? 'verse__star--on' : ''}`}
        onClick={onToggleStar}
        title={starred ? 'Unstar this verse' : 'Star as difficult — find it again under ★ Starred'}
        aria-label={starred ? 'Unstar verse' : 'Star verse'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.8l2.85 5.9 6.45.9-4.7 4.5 1.15 6.4L12 17.5l-5.75 3l1.15-6.4-4.7-4.5 6.45-.9z"
            fill={starred ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="verse__body">
        <p className="verse__greek" lang="grc">
          {verse.words.map((w, wi) => {
            const decision = analysis[wi]?.some((m) => m.kind === 'decision')
            const hasNote = wordHasNote(wi)
            const cls = [
              'word',
              decision ? 'word--decision' : '',
              hasNote ? 'word--noted' : '',
              w.ot ? 'word--ot' : '',
              selectedWord === wi ? 'word--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <Fragment key={wi}>
                {w.nlb && wi > 0 && <span className="line-break" />}
                <span className="word-unit">
                  {w.pp && <span className="punct">{w.pp}</span>}
                <button
                  className={cls}
                  onClick={() => onSelectWord(wi)}
                  title={w.gloss.lex + (hasNote ? ' · discussed in a note below' : '')}
                >
                  <span className="word__g">{w.g}</span>
                  {layers.translit && <span className="word__layer word__tr">{w.tr}</span>}
                  {layers.gloss && <span className="word__layer word__gl">{w.gloss.it || '–'}</span>}
                  {layers.parse && <span className="word__layer word__morph">{w.morph}</span>}
                </button>
                  {w.pf && <span className="punct">{w.pf}</span>}
                </span>
              </Fragment>
            )
          })}
        </p>

        <div className="verse__workspace">
          <textarea
            className="verse__draft"
            placeholder="Your translation…"
            value={draft}
            rows={draft ? Math.max(1, Math.ceil(draft.length / 90)) : 1}
            onChange={(e) => onDraft(e.target.value)}
            spellCheck={false}
          />
          <div className="verse__actions">
            <button className="reveal" onClick={onToggleCompare}>
              {showCompare ? 'Hide comparisons' : 'Compare translations'}
            </button>
          </div>

          {showCompare && (
            <div className="verse__compare">
              {smooth && (
                <div className="compare-row">
                  <span className="compare-row__label">word-by-word</span>
                  <span className="compare-row__text">{smooth}</span>
                </div>
              )}
              {Object.entries(data.translations).map(([id, verses]) => {
                const text = verses[String(verse.v)]
                if (!text) return null
                return (
                  <div key={id} className="compare-row">
                    <span className="compare-row__label" title={TRANSLATION_NAMES[id] ?? id}>
                      {id.toUpperCase()}
                    </span>
                    <span className="compare-row__text">{text}</span>
                  </div>
                )
              })}
            </div>
          )}

          {notes.length > 0 && (
            <div className="verse__notes">
              {notes.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// Greek punctuation -> closest English equivalent for the assembled gloss line.
function englishPunct(pf: string): string {
  return pf.replace('·', ';').replace(';', '?')
}
