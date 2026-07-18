// Compile authored verse notes (markdown + frontmatter) into chapter JSON.
//
// Notes live at content/notes/<book>/<chapter>/*.md — one file per note, so
// community contributions are simple pull requests adding a file. See
// CONTRIBUTING.md for the schema.
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './sources.mjs'

const CATEGORIES = ['grammar', 'syntax', 'lexical', 'textual', 'translation', 'context']

function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) throw new Error(`${file}: missing frontmatter block`)
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) throw new Error(`${file}: bad frontmatter line: "${line}"`)
    meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
  }
  return { meta, body: m[2].trim() }
}

// "3" -> {start:3,end:3}; "2-3" -> {start:2,end:3}
function parseRange(s, file, label) {
  const m = String(s).match(/^(\d+)(?:\s*-\s*(\d+))?$/)
  if (!m) throw new Error(`${file}: bad ${label}: "${s}"`)
  return { start: Number(m[1]), end: Number(m[2] ?? m[1]) }
}

// "1", "1-3", "1,4,5" -> [1] / [1,2,3] / [1,4,5]
function parseWords(s, file) {
  const out = []
  for (const part of String(s).split(',')) {
    const { start, end } = parseRange(part.trim(), file, 'words')
    for (let i = start; i <= end; i++) out.push(i)
  }
  return out
}

export function compileNotes(bookId, chapter) {
  const dir = path.join(ROOT, 'content', 'notes', bookId, String(chapter))
  if (!fs.existsSync(dir)) return []
  const notes = []
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.md')) continue
    const full = path.join(dir, file)
    const { meta, body } = parseFrontmatter(fs.readFileSync(full, 'utf8'), file)
    if (!meta.verse) throw new Error(`${file}: "verse" is required`)
    if (!meta.title) throw new Error(`${file}: "title" is required`)
    if (!meta.category || !CATEGORIES.includes(meta.category)) {
      throw new Error(`${file}: "category" must be one of ${CATEGORIES.join(', ')}`)
    }
    notes.push({
      id: file.replace(/\.md$/, ''),
      verse: parseRange(meta.verse, file, 'verse'),
      ...(meta.words ? { words: parseWords(meta.words, file) } : {}),
      category: meta.category,
      title: meta.title,
      ...(meta.author ? { author: meta.author } : {}),
      ...(meta.tags ? { tags: meta.tags.split(',').map((t) => t.trim()) } : {}),
      body,
    })
  }
  return notes.sort((a, b) => a.verse.start - b.verse.start || a.id.localeCompare(b.id))
}
