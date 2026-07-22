import type { Species, Filters } from "./types";

// A precomputed lowercase index over common + scientific names. A plain substring
// scan of 64k rows is ~3ms — versus ~60-190ms for fuzzy matching at this scale —
// and matches names more predictably.
let indexed: Species[] | null = null;
let commonL: string[] = [];
let sciL: string[] = [];

export function buildIndex(species: Species[]): void {
  if (indexed === species) return;
  indexed = species;
  commonL = species.map((s) => s.common.toLowerCase());
  sciL = species.map((s) => s.sci.toLowerCase());
}

/** Species whose common or scientific name contains the query, prefix matches first. */
export function runQuery(species: Species[], query: string): Species[] {
  const q = query.trim().toLowerCase();
  if (!q) return species;
  const hits: Array<{ s: Species; score: number }> = [];
  for (let i = 0; i < species.length; i++) {
    const c = commonL[i]!;
    const sci = sciL[i]!;
    const inC = c.includes(q);
    const inS = sci.includes(q);
    if (!inC && !inS) continue;
    // Lower score sorts first: exact > prefix > word-start > substring.
    let score = 4;
    if (c === q || sci === q) score = 0;
    else if (c.startsWith(q)) score = 1;
    else if (sci.startsWith(q)) score = 2;
    else if (c.includes(" " + q) || sci.includes(" " + q)) score = 3;
    hits.push({ s: species[i]!, score });
  }
  // Stable sort keeps the (alphabetical) input order within each score band.
  hits.sort((a, b) => a.score - b.score);
  return hits.map((h) => h.s);
}

/** Filters that define the "selection" the gap meter is measured over — everything except genome. */
export function applySelection(list: Species[], f: Filters): Species[] {
  return list.filter((s) => {
    if (f.threatenedOnly && !s.threatened) return false;
    if (f.cats.length > 0 && !f.cats.includes(s.cat)) return false;
    if (f.classes.length > 0 && !f.classes.includes(s.class)) return false;
    return true;
  });
}

/** The genome toggle narrows the visible rows but not the denominator. */
export function applyGenome(list: Species[], f: Filters): Species[] {
  if (f.genome === "yes") return list.filter((s) => s.hasGenome);
  if (f.genome === "no") return list.filter((s) => !s.hasGenome);
  return list;
}
