import type { ChapterData, Verse, Word } from '../lib/types'
import type { RuleMatch } from '../lib/rules'
import { decodeMorph, morphBadges } from '../lib/morph'
import { Markdown } from './Markdown'

interface Props {
  data: ChapterData
  verse: Verse
  word: Word
  matches: RuleMatch[]
  onClose: () => void
}

export function WordDetail({ data, verse, word, matches, onClose }: Props) {
  const lex = data.lexicon[word.sn]
  const rmacDesc = data.rmac[word.morph]
  const badges = morphBadges(decodeMorph(word.morph))

  // Other occurrences of this lemma in the chapter
  const occurrences = data.verses
    .filter((v) => v.words.some((w) => w.lemma === word.lemma))
    .map((v) => v.v)

  return (
    <aside className="word-panel" aria-label="Word details">
      <div className="word-panel__header">
        <div>
          <span className="word-panel__word" lang="grc">
            {word.g}
          </span>
          <span className="word-panel__tr">{word.tr}</span>
        </div>
        <button className="word-panel__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="word-panel__section">
        <span className="word-panel__lemma" lang="grc">
          {word.lemma}
        </span>
        <span className="word-panel__lexgloss">“{word.gloss.lex}”</span>
        <div className="word-panel__ids">
          <span className="chip">{word.sn}</span>
          {word.ln && <span className="chip" title="Louw–Nida semantic domain">LN {word.ln}</span>}
          {word.ot && (
            <span className="chip chip--ot" title="Part of an Old Testament quotation">
              OT quotation
            </span>
          )}
        </div>
      </div>

      <div className="word-panel__section">
        <h3>Parsing</h3>
        <p className="word-panel__morphcode">
          <code>{word.morph}</code>
        </p>
        {rmacDesc && <p className="word-panel__morphdesc">{rmacDesc}</p>}
        {badges.length > 0 && (
          <div className="word-panel__badges">
            {badges.map((b) => (
              <span key={b} className="chip chip--morph">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="word-panel__section">
        <h3>Gloss ladder</h3>
        <table className="gloss-ladder">
          <tbody>
            <tr>
              <th>lexical</th>
              <td>{word.gloss.lex || '–'}</td>
            </tr>
            <tr>
              <th>interlinear</th>
              <td>{word.gloss.it || '–'}</td>
            </tr>
            <tr>
              <th>literal</th>
              <td>{word.gloss.lt || '–'}</td>
            </tr>
            <tr>
              <th>smooth</th>
              <td>{word.gloss.st || '–'}</td>
            </tr>
          </tbody>
        </table>
        <p className="word-panel__hint">
          From dictionary meaning to natural English — watch what each step adds and asserts.
        </p>
      </div>

      {lex && (
        <div className="word-panel__section">
          <h3>Lexicon (Dodson)</h3>
          <p className="word-panel__lexbrief">{lex.brief}</p>
          <p className="word-panel__lexfull">{lex.full}</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="word-panel__section">
          <h3>Translation decisions</h3>
          {matches.map((m) => (
            <details key={m.rule} className={`rule rule--${m.kind}`} open={m.kind === 'decision'}>
              <summary>
                <span className="rule__kind">{m.kind}</span> {m.name}
              </summary>
              <Markdown className="rule__body md">{m.body}</Markdown>
            </details>
          ))}
        </div>
      )}

      <div className="word-panel__section">
        <h3>In this chapter</h3>
        <p className="word-panel__occ">
          <span lang="grc">{word.lemma}</span> appears in {occurrences.length} verse
          {occurrences.length === 1 ? '' : 's'}: {occurrences.join(', ')}
        </p>
        <p className="word-panel__hint">Currently viewing v. {verse.v}.</p>
      </div>
    </aside>
  )
}
