import type { Note } from '../lib/types'
import { Markdown } from './Markdown'

const refLabel = (n: Note) =>
  n.verse.start === n.verse.end ? `v. ${n.verse.start}` : `vv. ${n.verse.start}–${n.verse.end}`

export function NoteCard({ note }: { note: Note }) {
  return (
    <details className={`note note--${note.category}`}>
      <summary>
        <span className="note__category">{note.category}</span>
        <span className="note__title">{note.title}</span>
        <span className="note__ref">{refLabel(note)}</span>
      </summary>
      <Markdown className="note__body md">{note.body}</Markdown>
      {(note.author || note.tags) && (
        <p className="note__meta">
          {note.author && <span>— {note.author}</span>}
          {note.tags && <span className="note__tags"> · {note.tags.join(', ')}</span>}
        </p>
      )}
    </details>
  )
}
