// Build chapter data JSON for the app.
//
//   yarn pipeline mark 1 2 3 4     -> public/data/mark/{1..4}.json + index.json
//   yarn pipeline mark             -> all chapters present in OpenGNT for Mark
//
// Each chapter file is self-contained: words (text, morphology, glosses),
// the Dodson lexicon entries and RMAC descriptions used in that chapter,
// cached comparison translations, and compiled verse notes.
import fs from 'node:fs'
import path from 'node:path'
import {
  BOOKS,
  ROOT,
  CACHE_DIR,
  ensureSources,
  loadBookWords,
  loadDodson,
  loadRmac,
} from './lib/sources.mjs'
import { compileNotes } from './lib/notes.mjs'

const [bookId, ...chapterArgs] = process.argv.slice(2)
if (!bookId || !BOOKS[bookId]) {
  console.error(`Usage: node pipeline/build.mjs <book> [chapters...]`)
  console.error(`Books: ${Object.keys(BOOKS).join(', ')}`)
  process.exit(1)
}

const book = BOOKS[bookId]
await ensureSources()

console.log(`Loading OpenGNT words for ${book.name}...`)
const byChapter = loadBookWords(book.num)
const dodson = loadDodson()
const rmacDict = loadRmac()

const chapters = chapterArgs.length
  ? chapterArgs.map(Number)
  : [...byChapter.keys()].sort((a, b) => a - b)

const outDir = path.join(ROOT, 'public', 'data', bookId)
fs.mkdirSync(outDir, { recursive: true })

for (const ch of chapters) {
  const words = byChapter.get(ch)
  if (!words) {
    console.error(`No data for ${book.name} ${ch} — skipping`)
    continue
  }

  // Group into verses
  const verseMap = new Map()
  for (const w of words) {
    const { verse, ...rest } = w
    if (!verseMap.has(verse)) verseMap.set(verse, [])
    verseMap.get(verse).push(rest)
  }
  const verses = [...verseMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([v, ws]) => ({ v, words: ws }))

  // Chapter-local lexicon + morphology dictionaries
  const lexicon = {}
  const rmac = {}
  for (const w of words) {
    if (w.sn && !lexicon[w.sn]) {
      const entry = dodson.get(w.sn)
      if (entry) lexicon[w.sn] = entry
    }
    if (w.morph && !rmac[w.morph]) {
      rmac[w.morph] = rmacDict.get(w.morph) || ''
    }
  }

  // Cached translations (fetch-translations.mjs writes these)
  const translations = {}
  for (const t of ['bsb', 'web', 'asv', 'kjv']) {
    const f = path.join(CACHE_DIR, 'translations', `${bookId}-${ch}-${t}.json`)
    if (fs.existsSync(f)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'))
      translations[t] = Object.fromEntries(
        data.verses.map((v) => [v.verse, v.text.replace(/\s+/g, ' ').trim()])
      )
    }
  }
  if (!Object.keys(translations).length) {
    console.warn(`  (no cached translations for ${bookId} ${ch} — run: yarn pipeline:translations ${bookId} ${ch})`)
  }

  const notes = compileNotes(bookId, ch)

  const out = {
    book: bookId,
    bookName: book.name,
    chapter: ch,
    verses,
    lexicon,
    rmac,
    translations,
    notes,
  }
  const outFile = path.join(outDir, `${ch}.json`)
  fs.writeFileSync(outFile, JSON.stringify(out))
  console.log(
    `Wrote ${path.relative(ROOT, outFile)} (${verses.length} verses, ${words.length} words, ${notes.length} notes)`
  )
}

// Update the index of available chapters
const indexFile = path.join(ROOT, 'public', 'data', 'index.json')
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { books: {} }
const existing = new Set(index.books[bookId]?.chapters ?? [])
for (const ch of chapters) if (byChapter.has(ch)) existing.add(ch)
index.books[bookId] = {
  name: book.name,
  chapters: [...existing].sort((a, b) => a - b),
}
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2))
console.log(`Updated ${path.relative(ROOT, indexFile)}`)
