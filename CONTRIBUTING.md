# Contributing verse notes

Verse notes are the hand-authored layer of the site: commentary on real translation decisions —
textual variants, contested grammar, idioms, lexical range, theological freight. Each note is
**one markdown file**, so contributing is: add a file, open a pull request.

## Where notes live

```
content/notes/<book>/<chapter>/<file>.md
```

e.g. `content/notes/mark/1/41-splanchnistheis.md`. Name files `<verse>-<slug>.md`
(zero-pad the verse if you want tidy sorting). The filename becomes the note's id.

## File format

Markdown with a frontmatter block:

```markdown
---
verse: 41            # required — verse number, or a range like 2-3
words: 6-7           # optional — 1-based word positions in the (start) verse;
                     #   single "3", list "1,4", or range "2-5"
category: textual    # required — one of: grammar | syntax | lexical | textual | translation | context
title: Compassion or anger? σπλαγχνισθείς vs ὀργισθείς   # required
author: Your Name    # optional
tags: textual-criticism, famous-variant                    # optional, comma-separated
---

The body is ordinary markdown. Present the **decision**, the live **options**, and the
**evidence** for each — the goal is justified translation, not a settled verdict.
```

`words` anchors the note to specific words (they get a marker dot in the reader). Count words
in the Greek text of the verse, 1-based. Check your indices against the generated data:

```bash
node -e "const d=require('./public/data/mark/1.json'); console.log(d.verses.find(v=>v.v===41).words.map((w,i)=>(i+1)+':'+w.g).join(' '))"
```

## Style guide

- One decision per note. If a verse has two interesting problems, write two files.
- Lay out the options fairly, with the grammatical/text-critical reasoning for each; say which
  way translations actually go (public-domain versions can be quoted freely).
- Greek in Unicode (not beta code or transliteration alone).
- Cite categories of evidence (manuscripts, LXX parallels, usage statistics) rather than
  long quotations from copyrighted lexicons/commentaries — summarize in your own words.

## Licence

By submitting a note you agree to license it under **CC BY-SA 4.0** (the same licence as the
OpenGNT-derived data it annotates). You keep your copyright; the `author` frontmatter field is
your attribution.

## Compile and preview

```bash
yarn pipeline mark 1   # recompiles notes into public/data/mark/1.json (validates frontmatter)
yarn dev
```

The pipeline fails with a clear message if frontmatter is malformed.
