// Grammar-rule engine: detects recurring grammatical patterns and explains
// the translation decision each one forces. Rules run on generated data, so
// they apply automatically to any passage — unlike verse notes, which are
// authored by hand.
//
// Detection is deliberately generous: a rule firing means "this decision is
// probably in play here", not "this analysis is certain". Where detection is
// heuristic the explanation says so.

import type { Verse, Word } from './types'
import { decodeMorph, isArticle, isParticiple, isFiniteVerb, agreesCNG, type Morph } from './morph'

export type RuleKind = 'decision' | 'style' | 'info'

export interface RuleMatch {
  rule: string
  name: string
  kind: RuleKind
  /** one-line summary shown as a badge/tooltip */
  summary: string
  /** markdown explanation, including the live options */
  body: string
}

interface Ctx {
  book: string
  verse: Verse
  morphs: Morph[]
}

type Rule = (w: Word, i: number, ctx: Ctx) => RuleMatch | null

const NARRATIVE_BOOKS = new Set(['matthew', 'mark', 'luke', 'john', 'acts'])

/** True when the participle at i is governed by an agreeing article shortly before it. */
function isArticular(i: number, ctx: Ctx): boolean {
  const m = ctx.morphs[i]
  for (let j = Math.max(0, i - 3); j < i; j++) {
    if (isArticle(ctx.morphs[j]) && agreesCNG(ctx.morphs[j], m)) return true
  }
  return false
}

const aoristParticiple: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (!isParticiple(m) || m.tense !== 'aorist' || isArticular(i, ctx)) return null
  return {
    rule: 'ptc-aorist',
    name: 'Adverbial aorist participle',
    kind: 'decision',
    summary: 'Choose how this participle relates to the main verb — usually prior action.',
    body: `**${w.g}** (${w.lemma}) is an aorist participle with no article, so it most likely modifies the main verb adverbially. Greek loves participles where English prefers finite clauses, so you must *choose a relationship* and make it explicit:

- **Antecedent time** (the default for aorist): *"after/when ${w.gloss.lex ? `he ${w.gloss.lex}` : 'X-ing'}, …"*
- **Attendant circumstance**: translate as a coordinate verb — *"he did X **and** …"* (common when it precedes an aorist main verb in narrative)
- **Means or cause**: *"by/because …"* if context supports it

The aorist tense here signals *aspect* (the action viewed as a whole), typically prior to the main verb — not "past tense" in itself. Check which main verb this participle leans on, then pick the smoothest English relationship that preserves the sequence.`,
  }
}

const presentParticiple: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (!isParticiple(m) || m.tense !== 'present' || isArticular(i, ctx)) return null
  return {
    rule: 'ptc-present',
    name: 'Adverbial present participle',
    kind: 'decision',
    summary: 'Usually contemporaneous: "while/as …ing".',
    body: `**${w.g}** (${w.lemma}) is a present participle without an article, so it likely functions adverbially. Present-tense participles normally describe action *contemporaneous* with the main verb (imperfective aspect — in progress, unfolding):

- **Temporal**: *"while/as …ing"*
- **Manner/means**: *"…ing"* as the way the main action happens
- **Cause**: *"because …"* where the logic fits

First find the main verb it depends on; then ask whether the two actions overlap in time (usual) or whether a manner/cause reading is smoother.`,
  }
}

const articularParticiple: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (!isParticiple(m) || !isArticular(i, ctx)) return null
  return {
    rule: 'ptc-articular',
    name: 'Articular participle',
    kind: 'decision',
    summary: 'Article + participle: "the one who …" or an adjective-like modifier.',
    body: `**${w.g}** is a participle governed by an article, which changes its job entirely — it is *not* adverbial:

- **Substantival** (no noun to modify): translate as a noun phrase — *"the one who ${w.gloss.lex || '…'}s"*, *"those who …"*
- **Attributive** (agreeing noun nearby): translate like a relative clause — *"the X **who/that** …"*

This is one of the most common Greek constructions with no one-word English equivalent; a relative clause is almost always the right move.`,
  }
}

const genitiveAbsolute: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (!isParticiple(m) || m.case !== 'genitive' || isArticular(i, ctx)) return null
  // A genitive noun/pronoun adjacent (either side) suggests the construction.
  // i-2 covers postpositives intervening: Ὀψίας δὲ γενομένης.
  const near = [ctx.morphs[i - 2], ctx.morphs[i - 1], ctx.morphs[i + 1], ctx.morphs[i + 2]].filter(
    Boolean
  )
  // 'A' included: substantival adjectives like ὀψίας ("evening") head genitive absolutes too.
  const hasGenSubstantive = near.some(
    (n) => ['N', 'A', 'P', 'D', 'R'].includes(n.pos) && n.case === 'genitive' && agreesCNG(n, m)
  )
  if (!hasGenSubstantive) return null
  return {
    rule: 'gen-absolute',
    name: 'Possible genitive absolute',
    kind: 'decision',
    summary: 'Genitive participle + genitive noun, disconnected from the main clause.',
    body: `**${w.g}** is a genitive participle next to a genitive noun/pronoun — the classic shape of a **genitive absolute**: a participial clause whose subject is *not* part of the main clause (that's why it's "absolute", i.e. loosed from the sentence's grammar).

Translate it as a subordinate clause with its own subject:

- *"**When/after** [the genitive noun] …ed, [main clause]"*
- *"**While** [the genitive noun] was …ing, [main clause]"* (present participle)

Verify the diagnosis: the genitive noun should play no grammatical role in the main clause. If it does (e.g. it's possessing something), this is an ordinary genitive instead.`,
  }
}

const historicalPresent: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (!isFiniteVerb(m) || m.tense !== 'present' || m.mood !== 'indicative' || m.person !== 3) return null
  if (!NARRATIVE_BOOKS.has(ctx.book)) return null
  if (w.lemma === 'εἰμί' || w.lemma === 'ἔχω' || w.lemma === 'μέλλω') return null
  void i
  return {
    rule: 'historical-present',
    name: 'Possible historical present',
    kind: 'style',
    summary: 'Present tense in past narrative — usually rendered as English past.',
    body: `**${w.g}** is present indicative, but if the surrounding narrative is past-time this is likely a **historical present** — the narrator switches to present tense for vividness ("so he *says* to him…"), a hallmark of Mark's style (he does it ~150 times, especially with λέγει and ἔρχεται).

- Most English translations render it as **simple past** ("he said"), because English narrative doesn't tolerate tense-switching the way Greek does.
- A very literal translation may keep the present to show the device — useful in study, jarring in reading.

Check: is this inside narration (historical present) or inside quoted speech (a real present)? Only narration triggers the device.`,
  }
}

const imperfect: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (!isFiniteVerb(m) || m.tense !== 'imperfect') return null
  void i
  void ctx
  return {
    rule: 'imperfect',
    name: 'Imperfect indicative',
    kind: 'decision',
    summary: 'Past + imperfective aspect: ongoing, repeated, or beginning action.',
    body: `**${w.g}** (${w.lemma}) is imperfect: past time viewed as *in progress* rather than as a complete whole. English has no single form for this, so pick the nuance the context supports:

- **Progressive**: *"was/were …ing"* — action unfolding
- **Iterative/customary**: *"used to …", "kept …ing"* — repeated or habitual
- **Inceptive**: *"began to …"* — the start of an ongoing action (very common in Mark)
- **Conative**: *"tried to …"* — attempted action

A plain English simple past ("he taught") flattens the aspect; ask what the imperfect is doing *here* before settling.`,
  }
}

const perfect: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (m.pos !== 'V' || m.tense !== 'perfect' || m.mood === undefined) return null
  void i
  void ctx
  return {
    rule: 'perfect',
    name: 'Perfect tense',
    kind: 'decision',
    summary: 'Completed action with continuing result/state.',
    body: `**${w.g}** (${w.lemma}) is perfect tense: an action completed in the past whose *results remain in force*. The classic example is Mark 1:15 πεπλήρωται — "has been (and now stands) fulfilled."

- English perfect *"has/have …ed"* usually works
- Sometimes the **resulting state** is the real point: γέγραπται = "it stands written" (not merely "it was written at some point")

Ask: does the author care about the past event, or about the present state it created? Lean your English toward that.`,
  }
}

const hinaSubjunctive: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (m.mood !== 'subjunctive') return null
  for (let j = Math.max(0, i - 6); j < i; j++) {
    if (ctx.verse.words[j].lemma === 'ἵνα') {
      return {
        rule: 'hina',
        name: 'ἵνα + subjunctive',
        kind: 'decision',
        summary: 'Purpose ("so that"), result, or content clause — decide which.',
        body: `**${w.g}** is subjunctive following **ἵνα**. In Koine this construction has broadened well beyond classical purpose, so you must decide what the clause is doing:

- **Purpose**: *"so that / in order that …"* — the default guess
- **Result**: *"with the result that …"* — when the outcome, not intent, is in view
- **Content**: functions like a "that"-clause after verbs of asking, commanding, wishing (Koine often uses ἵνα where classical Greek used an infinitive)

Test: substitute *"in order that"* — if it sounds forced (e.g. after "he ordered them ἵνα…"), it's probably content, translate simply *"that …"* or with an English infinitive.`,
      }
    }
  }
  return null
}

const emphaticNegation: Rule = (w, i, ctx) => {
  if (w.lemma !== 'μή' || i === 0) return null
  if (ctx.verse.words[i - 1].lemma !== 'οὐ') return null
  return {
    rule: 'ou-me',
    name: 'Emphatic negation (οὐ μή)',
    kind: 'info',
    summary: 'Double negative = strongest possible denial, not a cancellation.',
    body: `**οὐ μή** with a subjunctive or future is Greek's *strongest* way to deny something future — the two negatives stack rather than cancel: *"certainly not", "never", "by no means"*.

A bare English "not" under-translates it. Reach for *"will never"* or *"certainly will not"*.`,
  }
}

const imperativeAspect: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (m.mood !== 'imperative' || !m.tense) return null
  void ctx
  const aorist = m.tense === 'aorist'
  return {
    rule: 'imperative-aspect',
    name: `${aorist ? 'Aorist' : 'Present'} imperative`,
    kind: 'info',
    summary: aorist
      ? 'Command viewed as a whole — often a specific, do-it act.'
      : 'Command with ongoing aspect — often continue/keep doing.',
    body: aorist
      ? `**${w.g}** is an *aorist* imperative: the command views the action as a complete whole — often a specific act in a specific situation ("do this"). English imperatives carry no aspect, so nothing special is usually needed; just be aware the choice of aorist (vs present) was available to the author and can imply "(simply) do it" rather than "keep doing it".`
      : `**${w.g}** is a *present* imperative: the command carries imperfective aspect — often *"keep …ing", "continue to …", "make a practice of …"*. Where context supports it, an English "keep/continue" makes the nuance visible; otherwise a plain imperative is fine, but note the author chose ongoing aspect.`,
  }
}

const periphrastic: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (w.lemma !== 'εἰμί' || !isFiniteVerb(m)) return null
  for (let j = i + 1; j <= i + 4 && j < ctx.verse.words.length; j++) {
    const pm = ctx.morphs[j]
    if (isParticiple(pm) && pm.number === m.number) {
      return {
        rule: 'periphrastic',
        name: 'Possible periphrastic construction',
        kind: 'decision',
        summary: 'εἰμί + participle may form one verbal idea ("was preaching").',
        body: `**${w.g}** (a form of εἰμί) is followed by the participle **${ctx.verse.words[j].g}** — possibly a **periphrastic** construction, where the two words together make a single verb form: ἦν κηρύσσων = *"he was preaching"* (not "he was, preaching").

- If periphrastic: translate as one English progressive verb.
- If not (the participle may just be adverbial or the εἰμί existential), keep them separate.

Test: does εἰμί have its own predicate (a "he was X" meaning)? If εἰμί feels empty without the participle, it's periphrastic. Mark is fond of this construction.`,
      }
    }
  }
  return null
}

const vocative: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (m.case !== 'vocative') return null
  void i
  void ctx
  return {
    rule: 'vocative',
    name: 'Vocative — direct address',
    kind: 'info',
    summary: 'The speaker is addressing someone directly.',
    body: `**${w.g}** is vocative: direct address ("O …", or simply the name/title set off with commas). Modern English drops "O" except in prayers or heightened speech — usually just punctuate: *"Teacher, do you not care…"*`,
  }
}

const infinitive: Rule = (w, i, ctx) => {
  const m = ctx.morphs[i]
  if (m.mood !== 'infinitive') return null
  void i
  void ctx
  return {
    rule: 'infinitive',
    name: 'Infinitive',
    kind: 'info',
    summary: 'Verbal noun — complementary, purpose, or articular usage.',
    body: `**${w.g}** (${w.lemma}) is an infinitive. Common jobs:

- **Complementary**: completes verbs like δύναμαι, ἄρχομαι, θέλω — *"is able **to do**", "began **to teach**"*
- **Purpose**: especially after verbs of motion — *"came **to destroy**"*
- **Articular infinitive** (with τοῦ/τῷ/τό, often after a preposition): translate as a clause — ἐν τῷ σπείρειν = *"while he was sowing"*

Identify which verb (or preposition) governs it before translating.`,
  }
}

const markanEuthys: Rule = (w, i, ctx) => {
  if (ctx.book !== 'mark') return null
  if (w.lemma !== 'εὐθύς' && w.lemma !== 'εὐθέως') return null
  void i
  return {
    rule: 'euthys',
    name: 'Markan εὐθύς',
    kind: 'style',
    summary: "Mark's signature 'immediately' — often a narrative connector.",
    body: `**εὐθύς** ("immediately/at once") appears ~42 times in Mark — far more than in any other NT book — and often works less as a stopwatch and more as a **narrative connector** pushing the story forward ("and then…", "straightaway").

- Translating every instance "immediately" is accurate but clunky in English (compare how translations vary: KJV "straightway", modern versions sometimes "at once", "just then", or even leave it light).
- Decide per instance: is real immediacy in view, or Markan pacing?`,
  }
}

const RULES: Rule[] = [
  articularParticiple,
  genitiveAbsolute,
  aoristParticiple,
  presentParticiple,
  historicalPresent,
  imperfect,
  perfect,
  hinaSubjunctive,
  emphaticNegation,
  imperativeAspect,
  periphrastic,
  vocative,
  infinitive,
  markanEuthys,
]

// A word matched by these should not also get the generic adverbial-participle rules.
const EXCLUSIVE_PTC = new Set(['ptc-articular', 'gen-absolute'])

/** Run all rules over a verse; returns matches per word index. */
export function analyzeVerse(verse: Verse, book: string): RuleMatch[][] {
  const morphs = verse.words.map((w) => decodeMorph(w.morph))
  const ctx: Ctx = { book, verse, morphs }
  return verse.words.map((w, i) => {
    const matches: RuleMatch[] = []
    for (const rule of RULES) {
      const m = rule(w, i, ctx)
      if (!m) continue
      if (
        (m.rule === 'ptc-aorist' || m.rule === 'ptc-present') &&
        matches.some((x) => EXCLUSIVE_PTC.has(x.rule))
      ) {
        continue
      }
      matches.push(m)
    }
    return matches
  })
}
