import { ExternalLink, ChevronRight } from "lucide-react";
import type { Species } from "~/lib/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, ASSEMBLY_LEVEL_SHORT } from "~/lib/format";

function StatusCell({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_COLOR[code] ?? "var(--color-ne)" }}
        aria-hidden
      />
      <span className="font-medium" style={{ color: CATEGORY_COLOR[code] ?? "var(--color-ne)" }}>
        {code}
      </span>
      <span className="hidden text-muted lg:inline">{CATEGORY_LABEL[code] ?? code}</span>
    </span>
  );
}

function GenomeCell({ s }: { s: Species }) {
  if (!s.hasGenome) {
    return <span className="text-faint">no genome</span>;
  }
  const level = ASSEMBLY_LEVEL_SHORT[s.level] ?? s.level;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <a
        href={`https://www.ncbi.nlm.nih.gov/datasets/genome/${s.accession}/`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group inline-flex items-center gap-1 font-mono text-[12px] text-genome hover:underline"
      >
        {s.accession}
        <ExternalLink size={11} className="opacity-0 transition-opacity group-hover:opacity-70" />
      </a>
      <span className="text-[12px] text-muted">
        {level}
        {s.refseq && <span className="ml-1 text-genome">· RefSeq</span>}
        {s.asmCount > 1 && <span className="ml-1 text-faint">· {s.asmCount} asm</span>}
      </span>
    </span>
  );
}

export function SpeciesTable({
  rows,
  onSelect,
}: {
  rows: Species[];
  onSelect: (s: Species) => void;
}) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="sticky top-0 z-10 bg-bg text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
          <th className="border-b border-line-strong px-3 py-2 font-semibold">Species</th>
          <th className="hidden border-b border-line-strong px-3 py-2 font-semibold md:table-cell">
            Class / Order
          </th>
          <th className="border-b border-line-strong px-3 py-2 font-semibold">Status</th>
          <th className="border-b border-line-strong px-3 py-2 font-semibold">Reference genome</th>
          <th className="w-16 border-b border-line-strong px-3 py-2 text-right font-semibold">
            Details
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr
            key={s.key}
            onClick={() => onSelect(s)}
            className="group cursor-pointer border-b border-line transition-colors hover:bg-surface-2"
          >
            <td className="px-3 py-2 align-top">
              <div className="font-medium italic text-ink">{s.sci}</div>
              {s.common && <div className="text-[12px] not-italic text-muted">{s.common}</div>}
            </td>
            <td className="hidden px-3 py-2 align-top text-ink-soft md:table-cell">
              <div>{s.class}</div>
              <div className="text-[12px] text-faint">{s.order}</div>
            </td>
            <td className="whitespace-nowrap px-3 py-2 align-top">
              <StatusCell code={s.cat} />
            </td>
            <td className="px-3 py-2 align-top">
              <GenomeCell s={s} />
            </td>
            <td className="px-3 py-2 align-middle text-right">
              <span className="inline-flex items-center gap-1 text-[12px] text-faint transition-colors group-hover:text-forest">
                <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 lg:inline">
                  Details
                </span>
                <ChevronRight size={15} />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
