# Regex pre-filter results — dashboard

A static dashboard presenting cross-validated results for keyword pre-filters on
two U.S. Statutes classification questions (Q1 and Q6), written for a
non-technical audience.

**[Live site](https://regex-analysis.vercel.app)** · deploys from this repo root.

## What it shows

- the recommended regular expression for each question, with copy buttons
- cross-validated performance at four operating points per question
- the measured cost/benefit of putting the filter in front of the AI classifier
- a decade-by-decade analysis of whether the filter survives changes in legal
  drafting style, with charts and tables
- a plain-language glossary of every metric, with worked examples

## Headline finding

Deploy the filter for **Q1**, not for **Q6** — the opposite of what the filter's
own accuracy scores suggest.

| | AI calls | relevant found | accuracy of flagged |
|---|---|---|---|
| Q1 — AI alone | 100% | 47.1% | 57.1% |
| **Q1 — filter + AI** | **23%** | 44.1% | **63.8%** |

The filter cuts AI workload by 77% and costs 2 relevant sections out of 68,
because the sections it discards are ones the AI was already missing. Q6's
pipeline already routes only 7.7% of sections to the expensive model, so a filter
there would save the cheap step while losing correct answers.

## Deploying

No build step and no dependencies.

```bash
npx vercel --prod
```

Framework preset "Other", no build command, output directory `.`.

## Viewing locally

```bash
python3 -m http.server 8099   # http://localhost:8099
```

Opening `index.html` from the filesystem also works, except the Copy buttons,
which need a served origin for clipboard access.

## Files

| File | Purpose |
|---|---|
| `index.html` | structure and all prose |
| `styles.css` | design tokens, light + dark themes, print styles |
| `app.js` | tables, hand-rolled SVG charts, tabs, theme toggle |
| `app-data.js` | the figures, as `window.DATA` |
| `data.json` | the same figures, unflattened |
| `vercel.json` | clean URLs and security headers |

## Provenance

Figures are generated from the analysis outputs, not hand-maintained. The
underlying analysis (code, cross-validation runs, technical report) lives in a
separate internal repository; this repo contains only aggregate results — no
row-level labels, section identifiers, or statute text.

A handful of figures are quoted inline in the prose rather than bound to
`app-data.js` (the 77%, the "2 of 68", the decade callout). Re-check those by hand
if the analysis is re-run.

## Accessibility

Charts carry hover tooltips and legends, every chart's data also appears as a
table, and both the light and dark palettes were validated for colour-vision
deficiency separation.
