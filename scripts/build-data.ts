/**
 * Build-time data fetch for the Genome Gap demo.
 *
 * Reads the three reviverestore collections from the Underlay, joins them on the
 * GBIF backbone key (`gbif:{nubKey}`), and writes the static JSON the SPA loads:
 *
 *   public/data/species.json  — one lean row per assessed vertebrate (the join)
 *   public/data/stats.json    — precomputed facet universes + headline totals
 *   public/data/meta.json     — source versions + attribution for the About page
 *
 * The gap itself is assembled here, at the app layer — the collections stay clean
 * single-source records, so more sources can be joined in later without a rebuild.
 */

import { writeFileSync, mkdirSync } from "node:fs";

const API_URL = process.env.UNDERLAY_API_URL ?? "https://dev.underlay.org";
const API_KEY = process.env.UNDERLAY_API_KEY ?? "";
const OWNER = "reviverestore";
const OUT_DIR = "public/data";

const AUTH_HEADERS: Record<string, string> = API_KEY
  ? { Authorization: `Bearer ${API_KEY}` }
  : {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch with retry/backoff, honoring 429 Retry-After. */
async function apiFetch(url: string | URL): Promise<Response> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: AUTH_HEADERS });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : (attempt + 1) * 2000;
      console.log(`    ${res.status} — waiting ${Math.round(wait / 1000)}s (attempt ${attempt + 1})...`);
      await sleep(wait);
      continue;
    }
    return res;
  }
  throw new Error(`Gave up after retries: ${url}`);
}

const ASSEMBLY_LEVEL_RANK: Record<string, number> = {
  "Complete Genome": 4,
  Chromosome: 3,
  Scaffold: 2,
  Contig: 1,
};

// IUCN category ordering (most to least at-risk), for stable facet display.
const CATEGORY_ORDER = ["EX", "EW", "CR", "EN", "VU", "NT", "DD", "LC"];
const CATEGORY_LABEL: Record<string, string> = {
  EX: "Extinct",
  EW: "Extinct in the Wild",
  CR: "Critically Endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near Threatened",
  DD: "Data Deficient",
  LC: "Least Concern",
  NE: "Not Evaluated",
};

interface RawRecord {
  id: string;
  type: string;
  data: Record<string, unknown>;
  hash: string;
}

async function fetchLatest(slug: string): Promise<{ semver: string }> {
  const res = await apiFetch(`${API_URL}/api/collections/${OWNER}/${slug}/versions/latest`);
  if (!res.ok) throw new Error(`latest ${slug}: ${res.status}`);
  return (await res.json()) as { semver: string };
}

async function fetchRecords(slug: string, semver: string): Promise<RawRecord[]> {
  const out: RawRecord[] = [];
  let cursor: string | undefined;
  while (true) {
    const url = new URL(`/api/collections/${OWNER}/${slug}/versions/${semver}/records`, API_URL);
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("after", cursor);
    const res = await apiFetch(url);
    if (!res.ok) throw new Error(`records ${slug}: ${res.status}`);
    const body = (await res.json()) as {
      records: RawRecord[];
      pagination: { hasMore: boolean; nextCursor: string };
    };
    out.push(...body.records);
    if (!body.pagination.hasMore) break;
    cursor = body.pagination.nextCursor;
  }
  return out;
}

async function load(slug: string): Promise<{ semver: string; records: RawRecord[] }> {
  const { semver } = await fetchLatest(slug);
  const records = await fetchRecords(slug, semver);
  console.log(`  ${OWNER}/${slug} @ ${semver}: ${records.length} records`);
  return { semver, records };
}

interface AssemblyDetail {
  accession: string;
  name: string;
  level: string;
  refseq: boolean;
  year: string;
  submitter: string;
  contigN50: number | null;
  ncbiTaxId: number | null;
}

interface AssemblySummary {
  count: number;
  bestLevel: string;
  hasRefSeq: boolean;
  accession: string;
  latestYear: string;
  ncbiTaxId: number | null;
}

/** Group assemblies by GBIF key, ordered best-level-first, for per-species detail. */
function groupAssemblies(assemblies: RawRecord[]): Map<number, AssemblyDetail[]> {
  const byKey = new Map<number, AssemblyDetail[]>();
  for (const a of assemblies) {
    const d = a.data as Record<string, unknown>;
    const key = d.gbifKey as number | undefined;
    if (key === undefined) continue;
    const detail: AssemblyDetail = {
      accession: (d.accession as string) ?? "",
      name: (d.assemblyName as string) ?? "",
      level: (d.assemblyLevel as string) ?? "Contig",
      refseq: Boolean(d.isRefSeq),
      year: ((d.releaseDate as string) ?? "").slice(0, 4),
      submitter: (d.submitter as string) ?? "",
      contigN50: typeof d.contigN50 === "number" ? d.contigN50 : null,
      ncbiTaxId: typeof d.ncbiTaxId === "number" ? d.ncbiTaxId : null,
    };
    const list = byKey.get(key);
    if (list) list.push(detail);
    else byKey.set(key, [detail]);
  }
  for (const list of byKey.values()) {
    list.sort(
      (a, b) =>
        (ASSEMBLY_LEVEL_RANK[b.level] ?? 0) - (ASSEMBLY_LEVEL_RANK[a.level] ?? 0) ||
        Number(b.refseq) - Number(a.refseq) ||
        b.year.localeCompare(a.year),
    );
  }
  return byKey;
}

function summarize(list: AssemblyDetail[]): AssemblySummary {
  let best = list[0]!;
  let latestYear = "";
  let hasRefSeq = false;
  let ncbiTaxId: number | null = null;
  for (const a of list) {
    hasRefSeq = hasRefSeq || a.refseq;
    if (a.year > latestYear) latestYear = a.year;
    if (ncbiTaxId === null && a.ncbiTaxId !== null) ncbiTaxId = a.ncbiTaxId;
    const better =
      (ASSEMBLY_LEVEL_RANK[a.level] ?? 0) > (ASSEMBLY_LEVEL_RANK[best.level] ?? 0) ||
      ((ASSEMBLY_LEVEL_RANK[a.level] ?? 0) === (ASSEMBLY_LEVEL_RANK[best.level] ?? 0) &&
        a.refseq &&
        !best.refseq);
    if (better) best = a;
  }
  return {
    count: list.length,
    bestLevel: best.level,
    hasRefSeq,
    accession: best.accession,
    latestYear,
    ncbiTaxId,
  };
}

interface SpeciesRow {
  id: string;
  key: number;
  sci: string;
  common: string;
  cat: string;
  threatened: boolean;
  class: string;
  order: string;
  family: string;
  genus: string;
  hasGenome: boolean;
  asmCount: number;
  level: string;
  refseq: boolean;
  accession: string;
  year: string;
  ncbiTaxId: number | null;
}

async function main() {
  console.log(`Reading reviverestore collections from ${API_URL}...`);
  const [species, backbone, assemblies] = await Promise.all([
    load("iucn-species"),
    load("gbif-backbone"),
    load("ncbi-assemblies"),
  ]);

  const asmGroups = groupAssemblies(assemblies.records);
  const genusByKey = new Map<number, string>();
  for (const t of backbone.records) {
    const d = t.data as Record<string, unknown>;
    if (typeof d.nubKey === "number" && typeof d.genus === "string") {
      genusByKey.set(d.nubKey, d.genus);
    }
  }

  const rows: SpeciesRow[] = [];
  for (const s of species.records) {
    const d = s.data as Record<string, unknown>;
    const key = d.gbifKey as number;
    const group = asmGroups.get(key);
    const asm = group ? summarize(group) : undefined;
    rows.push({
      id: s.id,
      key,
      sci: (d.canonicalName as string) ?? (d.scientificName as string) ?? "",
      common: (d.commonName as string) ?? "",
      cat: (d.category as string) ?? "NE",
      threatened: Boolean(d.threatened),
      class: (d.class as string) ?? "",
      order: (d.order as string) ?? "",
      family: (d.family as string) ?? "",
      genus: genusByKey.get(key) ?? (d.canonicalName as string ?? "").split(" ")[0] ?? "",
      hasGenome: Boolean(d.hasGenome),
      asmCount: asm?.count ?? 0,
      level: asm?.bestLevel ?? "",
      refseq: asm?.hasRefSeq ?? false,
      accession: asm?.accession ?? "",
      year: asm?.latestYear ?? "",
      ncbiTaxId: asm?.ncbiTaxId ?? null,
    });
  }

  rows.sort((a, b) => a.sci.localeCompare(b.sci));

  // --- Facet universes + headline totals ---
  const catCounts = new Map<string, { total: number; withGenome: number }>();
  const classCounts = new Map<string, { total: number; withGenome: number }>();
  const levelCounts = new Map<string, number>();
  let withGenome = 0;
  let threatened = 0;
  let threatenedWithGenome = 0;

  for (const r of rows) {
    const c = catCounts.get(r.cat) ?? { total: 0, withGenome: 0 };
    c.total++;
    if (r.hasGenome) c.withGenome++;
    catCounts.set(r.cat, c);

    if (r.class) {
      const cl = classCounts.get(r.class) ?? { total: 0, withGenome: 0 };
      cl.total++;
      if (r.hasGenome) cl.withGenome++;
      classCounts.set(r.class, cl);
    }

    if (r.hasGenome) {
      withGenome++;
      if (r.level) levelCounts.set(r.level, (levelCounts.get(r.level) ?? 0) + 1);
    }
    if (r.threatened) {
      threatened++;
      if (r.hasGenome) threatenedWithGenome++;
    }
  }

  const stats = {
    total: rows.length,
    withGenome,
    threatened,
    threatenedWithGenome,
    byCategory: CATEGORY_ORDER.filter((c) => catCounts.has(c)).map((code) => ({
      code,
      label: CATEGORY_LABEL[code] ?? code,
      total: catCounts.get(code)!.total,
      withGenome: catCounts.get(code)!.withGenome,
    })),
    byClass: [...classCounts.entries()]
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([name, v]) => ({ name, total: v.total, withGenome: v.withGenome })),
    byLevel: ["Complete Genome", "Chromosome", "Scaffold", "Contig"]
      .filter((l) => levelCounts.has(l))
      .map((level) => ({ level, count: levelCounts.get(level)! })),
  };

  const meta = {
    generatedAt: new Date().toISOString(),
    sources: {
      iucnSpecies: { collection: `${OWNER}/iucn-species`, version: species.semver },
      gbifBackbone: { collection: `${OWNER}/gbif-backbone`, version: backbone.semver },
      ncbiAssemblies: { collection: `${OWNER}/ncbi-assemblies`, version: assemblies.semver },
    },
    underlayUrl: process.env.VITE_UNDERLAY_URL ?? API_URL,
  };

  // Per-species assembly detail, keyed by GBIF key, loaded lazily by the detail drawer.
  const assembliesByKey: Record<string, AssemblyDetail[]> = {};
  for (const [key, list] of asmGroups) assembliesByKey[String(key)] = list;

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/species.json`, JSON.stringify(rows));
  writeFileSync(`${OUT_DIR}/assemblies.json`, JSON.stringify(assembliesByKey));
  writeFileSync(`${OUT_DIR}/stats.json`, JSON.stringify(stats, null, 2));
  writeFileSync(`${OUT_DIR}/meta.json`, JSON.stringify(meta, null, 2));

  console.log(
    `\nWrote ${rows.length} species (${withGenome} with a genome, ${threatened} threatened).`,
  );
  console.log(`  species.json, assemblies.json, stats.json, meta.json -> ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
