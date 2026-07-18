// Fetch public-domain comparison translations into the pipeline cache.
// WEB/KJV/ASV come from bible-api.com; BSB from bible.helloao.org.
// Run once per passage, then re-run `yarn pipeline`.
//
//   node pipeline/fetch-translations.mjs mark 1 2 3 4
import fs from 'node:fs'
import path from 'node:path'
import { BOOKS, CACHE_DIR } from './lib/sources.mjs'

const TRANSLATIONS = ['bsb', 'web', 'kjv', 'asv']

// helloao verse content is a list of strings and typed objects
// ({text, poem?}, {noteId}, {lineBreak}) — flatten to plain text.
function flattenHelloaoVerse(content) {
  return content
    .map((item) => (typeof item === 'string' ? item : (item.text ?? '')))
    .filter(Boolean)
    .join(' ')
}

async function fetchChapter(book, bookId, ch, t) {
  if (t === 'bsb') {
    const url = `https://bible.helloao.org/api/BSB/${book.usfm}/${ch}.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url}: ${res.status}`)
    const data = await res.json()
    return {
      verses: data.chapter.content
        .filter((c) => c.type === 'verse')
        .map((v) => ({ verse: v.number, text: flattenHelloaoVerse(v.content) })),
    }
  }
  const url = `https://bible-api.com/${encodeURIComponent(bookId)}+${ch}?translation=${t}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.json()
}

const [bookId, ...chapterArgs] = process.argv.slice(2)
if (!bookId || !BOOKS[bookId] || chapterArgs.length === 0) {
  console.error('Usage: node pipeline/fetch-translations.mjs <book> <chapters...>')
  process.exit(1)
}

const outDir = path.join(CACHE_DIR, 'translations')
fs.mkdirSync(outDir, { recursive: true })

for (const ch of chapterArgs.map(Number)) {
  for (const t of TRANSLATIONS) {
    const outFile = path.join(outDir, `${bookId}-${ch}-${t}.json`)
    if (fs.existsSync(outFile)) {
      console.log(`cached: ${bookId} ${ch} ${t}`)
      continue
    }
    let data
    try {
      data = await fetchChapter(BOOKS[bookId], bookId, ch, t)
    } catch (e) {
      console.error(`FAILED ${bookId} ${ch} ${t}: ${e.message}`)
      continue
    }
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2))
    console.log(`fetched: ${bookId} ${ch} ${t} (${data.verses.length} verses)`)
    await new Promise((r) => setTimeout(r, 500)) // be polite to the APIs
  }
}
