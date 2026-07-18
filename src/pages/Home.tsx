import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex } from '../lib/data'
import type { DataIndex } from '../lib/types'

export default function Home() {
  const [index, setIndex] = useState<DataIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadIndex().then(setIndex).catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="home">
      <section className="home__hero">
        <h1>
          Translate the Greek New Testament — <em>and know why</em>.
        </h1>
        <p>
          Every verse, word by word: morphology, lexicon, and the grammatical decisions a
          translator has to make. Write your own translation first, then peel back the layers and
          compare.
        </p>
      </section>

      <section className="home__how">
        <h2>How to work a verse</h2>
        <ol>
          <li>
            <strong>Attempt it bare.</strong> Read the Greek with all helps switched off and draft
            your translation in the workspace under the verse.
          </li>
          <li>
            <strong>Reveal layer by layer.</strong> Toggle transliteration, glosses, and parsing;
            click any word for its full morphology, lexicon entry, and the grammar decisions it
            triggers.
          </li>
          <li>
            <strong>Justify your choices.</strong> Amber-marked words carry a real translation
            decision (participle relationships, aspect, ἵνα-clauses…). Read the rule, pick an
            option, and note why.
          </li>
          <li>
            <strong>Compare.</strong> Reveal WEB / ASV / KJV and the verse notes to test your
            rendering against others — differences between translations usually mark genuine
            ambiguity in the Greek.
          </li>
        </ol>
      </section>

      <section className="home__books">
        <h2>Passages</h2>
        {error && <p className="error">Could not load the passage index: {error}</p>}
        {index &&
          Object.entries(index.books).map(([id, book]) => (
            <div key={id} className="home__book">
              <h3>{book.name}</h3>
              <div className="home__chapters">
                {book.chapters.map((ch) => (
                  <Link key={ch} to={`/${id}/${ch}`} className="chapter-link">
                    {ch}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        <p className="home__extend">
          Adding a passage is one command (<code>yarn pipeline &lt;book&gt; &lt;chapters&gt;</code>) —
          morphology, glosses and grammar rules work for the whole NT out of the box; verse notes
          grow as they are written.
        </p>
      </section>
    </div>
  )
}
