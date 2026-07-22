import { fmtInt, fmtPct, pct } from "~/lib/format";

interface GapMeterProps {
  total: number;
  withGenome: number;
  selectionLabel: string;
}

export function GapMeter({ total, withGenome, selectionLabel }: GapMeterProps) {
  const gap = total - withGenome;
  const coverage = pct(withGenome, total);

  return (
    <section className="border-b border-line pb-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <div
            className="font-display font-semibold leading-[0.9] tracking-[-0.02em] text-forest-deep"
            style={{ fontSize: "clamp(52px, 8vw, 80px)" }}
          >
            {total === 0 ? "—" : fmtPct(withGenome, total, coverage < 10 ? 1 : 0)}
          </div>
          <p className="mb-2 max-w-[22ch] text-[13px] leading-snug text-ink-soft">
            of <span className="font-medium text-ink">{selectionLabel}</span> have at least
            one reference genome
          </p>
        </div>

        <div className="text-[13px] text-muted sm:text-right">
          <div>
            <span className="font-medium text-genome">{fmtInt(withGenome)}</span> sequenced
          </div>
          <div>
            <span className="font-medium text-ink">{fmtInt(gap)}</span> still with no genome
          </div>
          <div className="text-faint">{fmtInt(total)} species in selection</div>
        </div>
      </div>

      {/* Proportional coverage bar */}
      <div className="mt-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-genome transition-[width] duration-500 ease-out"
            style={{ width: `${coverage}%` }}
            title={`${fmtInt(withGenome)} with a genome`}
          />
        </div>
      </div>
    </section>
  );
}
