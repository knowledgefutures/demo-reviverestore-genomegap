import type { Stats, Filters, GenomeFilter } from "~/lib/types";
import { CATEGORY_COLOR, fmtInt, pct } from "~/lib/format";

interface FacetsProps {
  stats: Stats;
  filters: Filters;
  catCounts: Map<string, number>;
  classCounts: Map<string, number>;
  onChange: (f: Filters) => void;
}

const GENOME_OPTIONS: Array<{ value: GenomeFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "yes", label: "Has genome" },
  { value: "no", label: "No genome" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
      {children}
    </div>
  );
}

/** A filter row: checkbox, label, live count, and a static coverage bar for the group. */
function FacetRow({
  label,
  color,
  count,
  coverage,
  checked,
  onToggle,
}: {
  label: string;
  color: string;
  count: number;
  coverage: number;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 py-[3px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-forest"
      />
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className={`flex-1 truncate text-[13px] ${checked ? "font-medium text-ink" : "text-ink-soft"}`}>
        {label}
      </span>
      <span className="w-10 text-right text-[12px] tabular-nums text-faint">{fmtInt(count)}</span>
      <span className="relative h-1.5 w-9 shrink-0 overflow-hidden rounded-full bg-line" title={`${coverage.toFixed(0)}% sequenced`}>
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-genome"
          style={{ width: `${coverage}%` }}
        />
      </span>
    </label>
  );
}

export function Facets({ stats, filters, catCounts, classCounts, onChange }: FacetsProps) {
  const toggleIn = (key: "cats" | "classes", value: string, checked: boolean) => {
    const set = new Set(filters[key]);
    if (checked) set.add(value);
    else set.delete(value);
    onChange({ ...filters, [key]: [...set] });
  };

  const active =
    filters.cats.length > 0 ||
    filters.classes.length > 0 ||
    filters.threatenedOnly ||
    filters.genome !== "all" ||
    filters.query.trim() !== "";

  return (
    <aside className="w-[236px] shrink-0 space-y-6">
      {/* Genome segmented control */}
      <div>
        <SectionTitle>Reference genome</SectionTitle>
        <div className="flex overflow-hidden rounded-md border border-line-strong">
          {GENOME_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, genome: opt.value })}
              className={`flex-1 px-2 py-1.5 text-[12px] font-medium transition-colors ${
                i > 0 ? "border-l border-line-strong" : ""
              } ${
                filters.genome === opt.value
                  ? "bg-forest text-white"
                  : "bg-surface text-ink-soft hover:bg-surface-2"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Threatened toggle */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={filters.threatenedOnly}
          onChange={(e) => onChange({ ...filters, threatenedOnly: e.target.checked })}
          className="h-3.5 w-3.5 accent-forest"
        />
        <span className={`text-[13px] ${filters.threatenedOnly ? "font-medium text-ink" : "text-ink-soft"}`}>
          Threatened only
        </span>
        <span className="text-[11px] text-faint">CR·EN·VU</span>
      </label>

      {/* Conservation status */}
      <div>
        <SectionTitle>Conservation status</SectionTitle>
        <div>
          {stats.byCategory.map((c) => (
            <FacetRow
              key={c.code}
              label={`${c.code} · ${c.label}`}
              color={CATEGORY_COLOR[c.code] ?? "var(--color-ne)"}
              count={catCounts.get(c.code) ?? 0}
              coverage={pct(c.withGenome, c.total)}
              checked={filters.cats.includes(c.code)}
              onToggle={(ch) => toggleIn("cats", c.code, ch)}
            />
          ))}
        </div>
      </div>

      {/* Taxonomic class */}
      <div>
        <SectionTitle>Taxonomic class</SectionTitle>
        <div>
          {stats.byClass
            .filter((c) => c.total >= 20)
            .map((c) => (
              <FacetRow
                key={c.name}
                label={c.name}
                color="var(--color-moss)"
                count={classCounts.get(c.name) ?? 0}
                coverage={pct(c.withGenome, c.total)}
                checked={filters.classes.includes(c.name)}
                onToggle={(ch) => toggleIn("classes", c.name, ch)}
              />
            ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line pt-2 text-[12px] text-faint">
        <span className="h-1.5 w-4 rounded-full bg-genome" aria-hidden />
        bar = share of group already sequenced
      </div>

      {active && (
        <button
          onClick={() =>
            onChange({ query: "", cats: [], classes: [], threatenedOnly: false, genome: "all" })
          }
          className="text-[12px] text-forest hover:underline"
        >
          Clear all filters
        </button>
      )}
    </aside>
  );
}
