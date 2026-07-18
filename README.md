# Koine Workbench

A study site for working through the translation of Koine New Testament Greek into English —
not just *what* a passage says, but *why* each rendering is justified. Currently loaded with
**Mark 1–4**; extensible to any NT passage with one command.

## The three layers of justification

1. **Mechanical (generated)** — every word carries its lemma, Robinson morphology,
   Strong's number, Louw–Nida domain, transliteration, and a four-step "gloss ladder"
   (lexical → interlinear → literal → smooth), plus the Dodson lexicon entry.
2. **Grammar rules (code, [src/lib/rules.ts](src/lib/rules.ts))** — pattern-matching rules that detect recurring
   translation decisions (adverbial vs articular participles, genitive absolutes, historical
   presents, imperfect nuances, ἵνα-clauses, imperative aspect, periphrastics, οὐ μή, Markan
   εὐθύς…) and explain the live options wherever they occur, in any passage.
3. **Verse notes (authored, [content/notes/](content/notes/))** — hand-written commentary on genuinely
   interesting decisions: famous variants (σπλαγχνισθείς vs ὀργισθείς), contested genitives,
   idioms, theology-laden renderings. One markdown file per note; see
   [CONTRIBUTING.md](CONTRIBUTING.md).

## Workflow in the app

Attempt each verse bare → toggle transliteration/glosses/parsing → click words for full
morphology, lexicon, and fired grammar rules → draft your translation (persisted locally) →
reveal WEB/ASV/KJV comparisons and the verse notes.

## Development

```bash
yarn            # install
yarn dev        # run locally
yarn build      # type-check + production build (deploys as a static site on Vercel)
```

## Adding a passage

```bash
yarn pipeline:translations matthew 5 6 7   # fetch + cache WEB/ASV/KJV
yarn pipeline matthew 5 6 7                # generate public/data/matthew/{5,6,7}.json
```

The pipeline downloads its sources on first run (cached in `pipeline/cache/`, gitignored).
Morphology, glosses, lexicon, and all grammar rules work immediately for any book; verse notes
are added by writing markdown files under `content/notes/<book>/<chapter>/` and re-running
`yarn pipeline <book> <chapters>`.

## Data sources & licences

| Source | Used for | Licence |
| --- | --- | --- |
| [OpenGNT](https://github.com/eliranwong/OpenGNT) | Greek text, morphology, glosses, Strong's, Louw–Nida, OT-quotation & clause markers | CC BY-SA 4.0 |
| Dodson Greek Lexicon | brief/full lexicon entries | public domain |
| Robinson morphological codes | parsing descriptions | public domain |
| [BSB](https://berean.bible/) via [bible.helloao.org](https://bible.helloao.org) | comparison translation | public domain (CC0) |
| WEB / ASV / KJV via [bible-api.com](https://bible-api.com) | comparison translations | public domain |

Rule explanations and verse notes are study aids, not authorities — verify against a reference
grammar (e.g. Wallace, *Greek Grammar Beyond the Basics*) and critical commentaries.

## Licence

- **Code** (`src/`, `pipeline/`): [MIT](LICENSE)
- **Generated data** (`public/data/`): CC BY-SA 4.0 (inherits OpenGNT's share-alike terms)
- **Verse notes** (`content/notes/`): CC BY-SA 4.0 — contributions are accepted under the
  same licence
- **Fonts** (`public/fonts/`, Cardo): SIL Open Font License 1.1
