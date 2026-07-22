import Fuse from "fuse.js";
import type { Species, Filters } from "./types";

let fuseInstance: Fuse<Species> | null = null;

export function initSearch(species: Species[]): Fuse<Species> {
  if (fuseInstance) return fuseInstance;
  fuseInstance = new Fuse(species, {
    keys: [
      { name: "common", weight: 2 },
      { name: "sci", weight: 1.5 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return fuseInstance;
}

/** Species matching the text query (or the full list, sorted, if no query). */
export function runQuery(species: Species[], fuse: Fuse<Species> | null, query: string): Species[] {
  if (query.trim() && fuse) return fuse.search(query.trim()).map((r) => r.item);
  return species;
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
