// Best-effort structured decoding of Robinson (RMAC) morphology codes.
// The human-readable description shipped in chapter data (rmac dict) is the
// authority for display; this decoder exists so grammar rules can pattern-match.

export interface Morph {
  pos: string
  tense?: 'present' | 'imperfect' | 'future' | 'aorist' | 'perfect' | 'pluperfect'
  voice?: 'active' | 'middle' | 'passive' | 'middle/passive'
  mood?: 'indicative' | 'subjunctive' | 'optative' | 'imperative' | 'infinitive' | 'participle'
  person?: 1 | 2 | 3
  case?: 'nominative' | 'genitive' | 'dative' | 'accusative' | 'vocative'
  number?: 'singular' | 'plural'
  gender?: 'masculine' | 'feminine' | 'neuter'
}

const TENSES: Record<string, Morph['tense']> = {
  P: 'present',
  I: 'imperfect',
  F: 'future',
  A: 'aorist',
  R: 'perfect',
  L: 'pluperfect',
  X: undefined,
}

const VOICES: Record<string, Morph['voice']> = {
  A: 'active',
  M: 'middle',
  P: 'passive',
  E: 'middle/passive',
  D: 'middle', // deponent
  O: 'passive', // deponent
  N: 'middle/passive', // deponent
}

const MOODS: Record<string, Morph['mood']> = {
  I: 'indicative',
  S: 'subjunctive',
  O: 'optative',
  M: 'imperative',
  N: 'infinitive',
  P: 'participle',
}

const CASES: Record<string, Morph['case']> = {
  N: 'nominative',
  G: 'genitive',
  D: 'dative',
  A: 'accusative',
  V: 'vocative',
}

const NUMBERS: Record<string, Morph['number']> = { S: 'singular', P: 'plural' }
const GENDERS: Record<string, Morph['gender']> = { M: 'masculine', F: 'feminine', N: 'neuter' }

function decodeNominal(seg: string, m: Morph) {
  // Optional leading person digit (pronouns), then case/number/gender, e.g. "1NS", "GSM", "NSF"
  const match = seg.match(/^([123])?([NGDAV])([SP])([MFN])?$/)
  if (!match) return
  if (match[1]) m.person = Number(match[1]) as Morph['person']
  m.case = CASES[match[2]]
  m.number = NUMBERS[match[3]]
  if (match[4]) m.gender = GENDERS[match[4]]
}

export function decodeMorph(code: string): Morph {
  const segs = code.split('-')
  const m: Morph = { pos: segs[0] }
  if (m.pos === 'V' && segs[1]) {
    // Tense (optional leading "2" for second aorist etc.), voice, mood: "PAI", "2AAP"
    const tvm = segs[1].replace(/^2/, '')
    m.tense = TENSES[tvm[0]]
    m.voice = VOICES[tvm[1]]
    m.mood = MOODS[tvm[2]]
    if (segs[2]) {
      const fin = segs[2].match(/^([123])([SP])$/)
      if (fin) {
        m.person = Number(fin[1]) as Morph['person']
        m.number = NUMBERS[fin[2]]
      } else {
        decodeNominal(segs[2], m) // participles carry case/number/gender
      }
    }
  } else if (segs[1]) {
    decodeNominal(segs[1], m)
  }
  return m
}

export const isArticle = (m: Morph) => m.pos === 'T'
export const isParticiple = (m: Morph) => m.mood === 'participle'
export const isFiniteVerb = (m: Morph) =>
  m.pos === 'V' && !!m.mood && !['participle', 'infinitive'].includes(m.mood)

export function agreesCNG(a: Morph, b: Morph): boolean {
  return !!a.case && a.case === b.case && !!a.number && a.number === b.number &&
    (!a.gender || !b.gender || a.gender === b.gender)
}

/** Compact badge list for UI display, e.g. ["aorist", "active", "participle", "nom sg masc"]. */
export function morphBadges(m: Morph): string[] {
  const out: string[] = []
  if (m.tense) out.push(m.tense)
  if (m.voice) out.push(m.voice)
  if (m.mood) out.push(m.mood)
  if (m.person) out.push(`${m.person}${m.person === 1 ? 'st' : m.person === 2 ? 'nd' : 'rd'} person`)
  const cng = [m.case?.slice(0, 3), m.number === 'singular' ? 'sg' : m.number ? 'pl' : undefined, m.gender?.slice(0, 4)]
    .filter(Boolean)
    .join(' ')
  if (cng) out.push(cng)
  return out
}
