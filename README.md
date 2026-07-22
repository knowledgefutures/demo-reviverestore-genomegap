# The Genome Gap

A searchable view of how many of the world's IUCN-assessed **vertebrate species**
have a **reference genome** — the killer question for conservation genomics, made
answerable by joining conservation status against genome availability.

Site A of the Revive & Restore genome-gap demos (the analytical, faceted-search
companion to the exploratory `reviverestore-explorer` visualization). Both are
built on the same three Underlay collections.

## What it shows

- A live **genome-gap meter** — "X% of {selection} have at least one reference
  genome" — that recomputes as you filter. The genome toggle narrows the list
  without moving the denominator.
- Faceted search over **64,063 assessed vertebrates**: conservation status
  (CR/EN/VU/NT/LC/DD/EW/EX), has-genome, taxonomic class, threatened-only, and
  free-text name search. Each facet carries a per-group "share sequenced" bar.
- A per-species detail drawer with full taxonomy, external identifiers (GBIF
  backbone, NCBI Taxonomy, IUCN Red List) and every NCBI assembly (accession,
  level, RefSeq, contig N50, submitter). Deep-linkable via `/?species=<gbifKey>`.

## Data

Built at deploy time from three versioned, content-addressed collections on the
Underlay, reconciled through the GBIF taxonomic backbone:

| Collection | Role |
| --- | --- |
| `reviverestore/iucn-species` | conservation status + taxonomy (IUCN Red List, via GBIF) |
| `reviverestore/ncbi-assemblies` | genome assembly metadata (NCBI Datasets) |
| `reviverestore/gbif-backbone` | taxonomic reconciliation keys |

`scripts/build-data.ts` fetches all three, joins them on the GBIF backbone key
(`gbif:{nubKey}`), and writes `public/data/{species,assemblies,stats,meta}.json`.
The gap is assembled here, at the app layer — the collections stay clean
single-source records, so more sources can be joined in later.

## Run locally

```bash
cp .env.example .env      # set UNDERLAY_API_KEY (read-scoped dev key)
pnpm install
pnpm prebuild             # fetch + join the collections -> public/data/
pnpm dev                  # http://localhost:5173
```

`public/data/` is gitignored; `pnpm prebuild` (and `pnpm build`) regenerate it.

## Deploy

Cloudflare Pages, connected to this repo. Build command `pnpm build` (runs the
prebuild then `vite build`), output directory `dist/`. Set `UNDERLAY_API_URL`,
`UNDERLAY_API_KEY`, and `VITE_UNDERLAY_URL` in the Pages environment.

Live: _demo-reviverestore-genomegap.knowledgefutures.org_ (pending Pages setup).

## Stack

Vite + React 19 + Tailwind 4 + TypeScript, per the KF demo conventions. Search is
`fuse.js`; the filter pipeline runs off `useDeferredValue` so typing stays smooth
over the full 64k-row dataset.
