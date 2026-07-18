export interface WordGloss {
  /** lexical gloss (dictionary form meaning) */
  lex: string
  /** interlinear translation (word-for-word, in context) */
  it: string
  /** literal translation */
  lt: string
  /** smooth translation */
  st: string
}

export interface Word {
  /** accented Greek word */
  g: string
  /** transliteration */
  tr: string
  lemma: string
  /** Robinson morphology code, e.g. V-PAI-3S */
  morph: string
  /** Strong's number, e.g. G746 */
  sn: string
  /** Louw-Nida semantic domain(s) */
  ln: string
  gloss: WordGloss
  /** punctuation preceding the word */
  pp: string
  /** punctuation following the word */
  pf: string
  /** Levinsohn clause id */
  clause: string
  /** poetry/quotation line break before this word */
  nlb?: boolean
  /** set when the word is part of an OT quotation */
  ot?: string
}

export interface Verse {
  v: number
  words: Word[]
}

export interface VerseRange {
  start: number
  end: number
}

export type NoteCategory = 'grammar' | 'syntax' | 'lexical' | 'textual' | 'translation' | 'context'

export interface Note {
  id: string
  verse: VerseRange
  /** 1-based word positions within the verse the note attaches to */
  words?: number[]
  category: NoteCategory
  title: string
  author?: string
  tags?: string[]
  /** markdown */
  body: string
}

export interface LexiconEntry {
  brief: string
  full: string
}

export interface ChapterData {
  book: string
  bookName: string
  chapter: number
  verses: Verse[]
  /** Dodson entries for Strong's numbers appearing in this chapter */
  lexicon: Record<string, LexiconEntry>
  /** RMAC code -> human-readable description */
  rmac: Record<string, string>
  /** translation id -> verse number (string) -> text */
  translations: Record<string, Record<string, string>>
  notes: Note[]
}

export interface BookIndex {
  name: string
  chapters: number[]
}

export interface DataIndex {
  books: Record<string, BookIndex>
}

export const TRANSLATION_NAMES: Record<string, string> = {
  bsb: 'Berean Standard Bible',
  web: 'World English Bible',
  asv: 'American Standard Version (1901)',
  kjv: 'King James Version',
}
