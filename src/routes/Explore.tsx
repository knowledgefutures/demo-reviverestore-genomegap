import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { Search, X } from "lucide-react";
import type { Species, Stats, Filters } from "~/lib/types";
import { EMPTY_FILTERS } from "~/lib/types";
import { loadSpecies, loadStats } from "~/lib/data";
import { buildIndex, runQuery, applySelection, applyGenome } from "~/lib/search";
import { CATEGORY_LABEL, fmtInt } from "~/lib/format";
import { GapMeter } from "~/components/GapMeter";
import { Facets } from "~/components/Facets";
import { SpeciesTable } from "~/components/SpeciesTable";
import { SpeciesDetail } from "~/components/SpeciesDetail";

const PAGE = 80;

function selectionLabel(f: Filters): string {
  const status = f.threatenedOnly
    ? "threatened"
    : f.cats.length >= 1 && f.cats.length <= 2
      ? f.cats.map((c) => (CATEGORY_LABEL[c] ?? c).toLowerCase()).join(" & ")
      : "assessed";
  const taxon = f.classes.length === 1 ? f.classes[0]! : "vertebrate";
  return `${status} ${taxon} species`;
}

function countBy(list: Species[], key: (s: Species) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of list) {
    const k = key(s);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function ExplorePage() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);

  // Heavy work reads the *deferred* filters so typing/clicking stays responsive;
  // the live `filters` drive the controls for instant feedback.
  const dFilters = useDeferredValue(filters);
  const isStale = filters !== dFilters;

  useEffect(() => {
    Promise.all([loadSpecies(), loadStats()]).then(([sp, st]) => {
      setSpecies(sp);
      setStats(st);
      buildIndex(sp);
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      // Deep link: /?q=<text> pre-fills the search.
      const q = params.get("q");
      if (q) setFilters((f) => ({ ...f, query: q }));
      // Deep link: /?species=<gbifKey> opens that species' detail.
      const wanted = params.get("species");
      if (wanted) {
        const match = sp.find((s) => String(s.key) === wanted);
        if (match) setSelected(match);
      }
    });
  }, []);

  const afterQuery = useMemo(
    () => runQuery(species, dFilters.query),
    [species, dFilters.query],
  );

  const selection = useMemo(() => applySelection(afterQuery, dFilters), [afterQuery, dFilters]);
  const withGenome = useMemo(() => selection.filter((s) => s.hasGenome).length, [selection]);
  const rows = useMemo(() => applyGenome(selection, dFilters), [selection, dFilters]);

  const catCounts = useMemo(
    () =>
      countBy(
        applyGenome(
          afterQuery.filter(
            (s) =>
              (!dFilters.threatenedOnly || s.threatened) &&
              (dFilters.classes.length === 0 || dFilters.classes.includes(s.class)),
          ),
          dFilters,
        ),
        (s) => s.cat,
      ),
    [afterQuery, dFilters],
  );

  const classCounts = useMemo(
    () =>
      countBy(
        applyGenome(
          afterQuery.filter(
            (s) =>
              (!dFilters.threatenedOnly || s.threatened) &&
              (dFilters.cats.length === 0 || dFilters.cats.includes(s.cat)),
          ),
          dFilters,
        ),
        (s) => s.class,
      ),
    [afterQuery, dFilters],
  );

  const update = (f: Filters) => {
    setFilters(f);
    setVisible(PAGE);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        Loading {fmtInt(64063)} species…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => update({ ...filters, query: e.target.value })}
          placeholder="Search by common or scientific name — e.g. cheetah, Panthera, axolotl"
          className="w-full rounded-lg border border-line-strong bg-surface py-3 pl-11 pr-10 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-forest"
        />
        {filters.query && (
          <button
            onClick={() => update({ ...filters, query: "" })}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink-soft"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <GapMeter
        total={selection.length}
        withGenome={withGenome}
        selectionLabel={selectionLabel(dFilters)}
      />

      <div className="flex gap-8">
        <Facets
          stats={stats}
          filters={filters}
          catCounts={catCounts}
          classCounts={classCounts}
          onChange={update}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[13px] text-muted">
              <span className="font-medium text-ink">{fmtInt(rows.length)}</span> species
              {dFilters.query.trim() && " matching"}
              {isStale && <span className="ml-2 text-faint">updating…</span>}
            </span>
            <span className="text-[12px] text-faint">
              {dFilters.query.trim() ? "by relevance" : "A–Z by scientific name"}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="py-16 text-center text-muted">No species match this selection.</div>
          ) : (
            <div className={isStale ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <SpeciesTable rows={rows.slice(0, visible)} onSelect={setSelected} />
              {visible < rows.length && (
                <button
                  onClick={() => setVisible((v) => v + PAGE * 3)}
                  className="mt-4 w-full rounded-lg border border-line-strong py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-2"
                >
                  Show more — {fmtInt(rows.length - visible)} remaining
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && <SpeciesDetail species={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
