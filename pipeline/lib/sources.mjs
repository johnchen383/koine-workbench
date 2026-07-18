// Shared loaders for pipeline data sources (cached in pipeline/cache/).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const CACHE_DIR = path.join(__dirname, '..', 'cache')
export const ROOT = path.join(__dirname, '..', '..')

const OPENGNT_ZIP_URL =
  'https://raw.githubusercontent.com/eliranwong/OpenGNT/master/OpenGNT_BASE_TEXT.zip'
const RMAC_URL =
  'https://raw.githubusercontent.com/eliranwong/OpenGNT/master/OpenGNT_DictRMAC_English.tsv'
const DODSON_URL =
  'https://raw.githubusercontent.com/biblicalhumanities/Dodson-Greek-Lexicon/master/dodson.csv'

// num: OpenGNT book number (Matthew=40 ... Revelation=66)
// usfm: USFM book code, used by the bible.helloao.org API
export const BOOKS = {
  matthew: { num: 40, name: 'Matthew', osis: 'Matt', usfm: 'MAT' },
  mark: { num: 41, name: 'Mark', osis: 'Mark', usfm: 'MRK' },
  luke: { num: 42, name: 'Luke', osis: 'Luke', usfm: 'LUK' },
  john: { num: 43, name: 'John', osis: 'John', usfm: 'JHN' },
  acts: { num: 44, name: 'Acts', osis: 'Acts', usfm: 'ACT' },
  romans: { num: 45, name: 'Romans', osis: 'Rom', usfm: 'ROM' },
  '1corinthians': { num: 46, name: '1 Corinthians', osis: '1Cor', usfm: '1CO' },
  '2corinthians': { num: 47, name: '2 Corinthians', osis: '2Cor', usfm: '2CO' },
  galatians: { num: 48, name: 'Galatians', osis: 'Gal', usfm: 'GAL' },
  ephesians: { num: 49, name: 'Ephesians', osis: 'Eph', usfm: 'EPH' },
  philippians: { num: 50, name: 'Philippians', osis: 'Phil', usfm: 'PHP' },
  colossians: { num: 51, name: 'Colossians', osis: 'Col', usfm: 'COL' },
  '1thessalonians': { num: 52, name: '1 Thessalonians', osis: '1Thess', usfm: '1TH' },
  '2thessalonians': { num: 53, name: '2 Thessalonians', osis: '2Thess', usfm: '2TH' },
  '1timothy': { num: 54, name: '1 Timothy', osis: '1Tim', usfm: '1TI' },
  '2timothy': { num: 55, name: '2 Timothy', osis: '2Tim', usfm: '2TI' },
  titus: { num: 56, name: 'Titus', osis: 'Titus', usfm: 'TIT' },
  philemon: { num: 57, name: 'Philemon', osis: 'Phlm', usfm: 'PHM' },
  hebrews: { num: 58, name: 'Hebrews', osis: 'Heb', usfm: 'HEB' },
  james: { num: 59, name: 'James', osis: 'Jas', usfm: 'JAS' },
  '1peter': { num: 60, name: '1 Peter', osis: '1Pet', usfm: '1PE' },
  '2peter': { num: 61, name: '2 Peter', osis: '2Pet', usfm: '2PE' },
  '1john': { num: 62, name: '1 John', osis: '1John', usfm: '1JN' },
  '2john': { num: 63, name: '2 John', osis: '2John', usfm: '2JN' },
  '3john': { num: 64, name: '3 John', osis: '3John', usfm: '3JN' },
  jude: { num: 65, name: 'Jude', osis: 'Jude', usfm: 'JUD' },
  revelation: { num: 66, name: 'Revelation', osis: 'Rev', usfm: 'REV' },
}

async function download(url, dest) {
  console.log(`  downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

export async function ensureSources() {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const csv = path.join(CACHE_DIR, 'OpenGNT_version3_3.csv')
  if (!fs.existsSync(csv)) {
    const zip = path.join(CACHE_DIR, 'OpenGNT_BASE_TEXT.zip')
    if (!fs.existsSync(zip)) await download(OPENGNT_ZIP_URL, zip)
    const { execSync } = await import('node:child_process')
    execSync(`unzip -o "${zip}" OpenGNT_version3_3.csv -d "${CACHE_DIR}"`, { stdio: 'inherit' })
  }
  const rmac = path.join(CACHE_DIR, 'OpenGNT_DictRMAC_English.tsv')
  if (!fs.existsSync(rmac)) await download(RMAC_URL, rmac)
  const dodson = path.join(CACHE_DIR, 'dodson.csv')
  if (!fs.existsSync(dodson)) await download(DODSON_URL, dodson)
}

// Split an OpenGNT bracketed field: 〔a｜b｜c〕 -> [a, b, c]
function unbracket(field) {
  return field.replace(/^〔/, '').replace(/〕$/, '').split('｜')
}

/**
 * Parse OpenGNT rows for one book into word objects grouped by chapter.
 * Returns Map<chapterNum, Array<word>>.
 */
export function loadBookWords(bookNum) {
  const csv = fs.readFileSync(path.join(CACHE_DIR, 'OpenGNT_version3_3.csv'), 'utf8')
  const lines = csv.split('\n')
  const chapters = new Map()
  const marker = `〔${bookNum}｜`
  for (const line of lines) {
    if (!line.includes(marker)) continue
    const cols = line.split('\t')
    // Columns (0-based):
    // 3 LevinsohnClauseID, 4 OTquotation, 6 Book|Chapter|Verse,
    // 7 OGNTk|OGNTu|OGNTa|lexeme|rmac|sn, 8 BDAG|EDNT|Mounce|GK|LouwNida,
    // 9 transSBLcap|transSBL|modernGreek|Fonetica, 10 TBESG|IT|LT|ST|Espanol,
    // 11 PMpWord|PMfWord
    const [book, chapter, verse] = unbracket(cols[6]).map(Number)
    if (book !== bookNum) continue
    const [, , ognta, lexeme, rmac, sn] = unbracket(cols[7])
    const bdagGroup = unbracket(cols[8])
    const louwNida = (bdagGroup[4] || '').replace(/^LN-/, '')
    const [translitCap] = unbracket(cols[9])
    const [tbesg, it, lt, st] = unbracket(cols[10])
    const [pmpRaw, pmfRaw] = unbracket(cols[11] || '〔｜〕')
    const pmp = parsePunct(pmpRaw)
    const pmf = parsePunct(pmfRaw)
    const clause = cols[3] || ''
    const ot = (cols[4] || '-').trim()
    const word = {
      g: ognta, // accented Greek word
      tr: translitCap, // transliteration
      lemma: lexeme,
      morph: rmac, // Robinson morphology code e.g. V-PAI-3S
      sn, // Strong's number e.g. G746
      ln: louwNida, // Louw-Nida domain(s)
      gloss: {
        lex: tbesg, // lexical gloss (Tyndale Brief lexicon of Extended Strongs)
        it: stripPunct(it), // interlinear translation
        lt: stripPunct(lt), // literal translation
        st: stripPunct(st), // smooth translation
      },
      pp: pmp.text, // punctuation preceding
      pf: pmf.text, // punctuation following
      clause,
      ...(pmp.newline ? { nlb: true } : {}), // poetry line break before this word
      ...(ot && ot !== '-' ? { ot } : {}),
      verse,
    }
    if (!chapters.has(chapter)) chapters.set(chapter, [])
    chapters.get(chapter).push(word)
  }
  return chapters
}

// OpenGNT punctuation fields wrap each mark in <pm>...</pm> and include layout
// marks: ¬ = poetry/quotation line break, ¶ = paragraph. Extract the real
// punctuation as plain text; surface ¬ as a flag, drop ¶ (verses render as
// cards, so paragraphing adds nothing).
function parsePunct(raw) {
  const marks = [...(raw || '').matchAll(/<pm>(.*?)<\/pm>/g)].map((m) => m[1])
  return {
    text: marks.filter((m) => m !== '¬' && m !== '¶').join(''),
    newline: marks.includes('¬'),
  }
}

// OpenGNT glosses embed trailing English punctuation ("Christ,") — strip it,
// punctuation is rendered from pp/pf instead.
function stripPunct(s) {
  return (s || '').replace(/[,.;:!?]+$/, '').trim()
}

/** Dodson lexicon keyed by Strong's number ("G746"). */
export function loadDodson() {
  const raw = fs.readFileSync(path.join(CACHE_DIR, 'dodson.csv'), 'utf8')
  const lines = raw.split('\n').slice(1)
  const map = new Map()
  for (const line of lines) {
    if (!line.trim()) continue
    // Tab-separated with quoted fields
    const cols = line.split('\t').map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'))
    const [strongs, , , brief, full] = cols
    if (!strongs) continue
    map.set(`G${parseInt(strongs, 10)}`, { brief, full })
  }
  return map
}

// The source TSV encodes code letters as mid-word capitals ("reFlexive
// pronoun", "depOnent") and capitalizes segments inconsistently. Normalize to
// sentence case, restoring proper nouns.
const RMAC_PROPER = ['Attic', 'Aeolic', 'Aramaic', 'Hebrew', 'Greek']

function normalizeRmacDesc(desc) {
  let s = desc.toLowerCase()
  s = s.charAt(0).toUpperCase() + s.slice(1)
  for (const p of RMAC_PROPER) {
    s = s.replaceAll(p.toLowerCase(), p)
  }
  return s
}

/** RMAC code -> human description, e.g. "V-PAI-3S" -> "Verb, present, active, indicative, 3rd person, singular". */
export function loadRmac() {
  const raw = fs.readFileSync(path.join(CACHE_DIR, 'OpenGNT_DictRMAC_English.tsv'), 'utf8')
  const map = new Map()
  for (const line of raw.split('\n').slice(1)) {
    const [code, desc] = line.split('\t')
    if (code && desc) map.set(code.trim(), normalizeRmacDesc(desc.trim()))
  }
  return map
}
