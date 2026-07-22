import type { Species, Stats, Meta, AssembliesByKey } from "./types";

let speciesCache: Species[] | null = null;
let statsCache: Stats | null = null;
let metaCache: Meta | null = null;
let assembliesCache: AssembliesByKey | null = null;
let assembliesPromise: Promise<AssembliesByKey> | null = null;

export async function loadSpecies(): Promise<Species[]> {
  if (speciesCache) return speciesCache;
  const res = await fetch("/data/species.json");
  speciesCache = (await res.json()) as Species[];
  return speciesCache;
}

export async function loadStats(): Promise<Stats> {
  if (statsCache) return statsCache;
  const res = await fetch("/data/stats.json");
  statsCache = (await res.json()) as Stats;
  return statsCache;
}

export async function loadMeta(): Promise<Meta> {
  if (metaCache) return metaCache;
  const res = await fetch("/data/meta.json");
  metaCache = (await res.json()) as Meta;
  return metaCache;
}

/** Per-species assembly detail, fetched once, on first drawer open. */
export async function loadAssemblies(): Promise<AssembliesByKey> {
  if (assembliesCache) return assembliesCache;
  if (!assembliesPromise) {
    assembliesPromise = fetch("/data/assemblies.json")
      .then((res) => res.json() as Promise<AssembliesByKey>)
      .then((data) => {
        assembliesCache = data;
        return data;
      });
  }
  return assembliesPromise;
}
