// Per-user study state, persisted in localStorage: draft translations,
// starred (difficult) verses, and which comparison panels are revealed.

const draftKey = (book: string, chapter: number, verse: number) =>
  `kw:trans:${book}:${chapter}:${verse}`
const revealKey = (book: string, chapter: number, verse: number) =>
  `kw:reveal:${book}:${chapter}:${verse}`
const STARS_KEY = 'kw:stars'

function get(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function set(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode etc.) — state just won't persist
  }
}

// ---- draft translations ----

export function loadDraft(book: string, chapter: number, verse: number): string {
  return get(draftKey(book, chapter, verse)) ?? ''
}

export function saveDraft(book: string, chapter: number, verse: number, text: string) {
  set(draftKey(book, chapter, verse), text.trim() ? text : null)
}

// ---- comparison reveal state ----

export function loadReveal(book: string, chapter: number, verse: number): boolean {
  return get(revealKey(book, chapter, verse)) === '1'
}

export function saveReveal(book: string, chapter: number, verse: number, open: boolean) {
  set(revealKey(book, chapter, verse), open ? '1' : null)
}

// ---- starred verses ----

export interface StarRef {
  book: string
  chapter: number
  verse: number
  starredAt: number
}

export function listStars(): StarRef[] {
  try {
    const raw = get(STARS_KEY)
    return raw ? (JSON.parse(raw) as StarRef[]) : []
  } catch {
    return []
  }
}

const sameRef = (s: StarRef, book: string, chapter: number, verse: number) =>
  s.book === book && s.chapter === chapter && s.verse === verse

export function isStarred(book: string, chapter: number, verse: number): boolean {
  return listStars().some((s) => sameRef(s, book, chapter, verse))
}

/** Toggle a star; returns the new state. */
export function toggleStar(book: string, chapter: number, verse: number): boolean {
  const stars = listStars()
  const idx = stars.findIndex((s) => sameRef(s, book, chapter, verse))
  if (idx >= 0) {
    stars.splice(idx, 1)
  } else {
    stars.push({ book, chapter, verse, starredAt: Date.now() })
  }
  set(STARS_KEY, JSON.stringify(stars))
  return idx < 0
}
