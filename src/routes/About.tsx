import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Meta, Stats } from "~/lib/types";
import { loadMeta, loadStats } from "~/lib/data";
import { fmtInt, fmtPct } from "~/lib/format";

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-ink-soft">{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[19px] font-semibold text-forest-deep">{children}</h2>
  );
}

export function AboutPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadMeta().then(setMeta);
    loadStats().then(setStats);
  }, []);

  const underlay = meta?.underlayUrl ?? "https://dev.underlay.org";

  return (
    <div className="mx-auto max-w-[760px] space-y-8 py-2">
      <div className="space-y-3">
        <h1 className="font-display text-[30px] font-semibold leading-tight text-forest-deep">
          A reference genome is the foundation of modern conservation genetics — most
          threatened species still don&rsquo;t have one.
        </h1>
        {stats && (
          <Prose>
            Of <strong className="text-ink">{fmtInt(stats.total)}</strong> IUCN-assessed
            vertebrate species, only{" "}
            <strong className="text-ink">{fmtPct(stats.withGenome, stats.total)}</strong> have at
            least one genome assembly in NCBI. Among the{" "}
            <strong className="text-ink">{fmtInt(stats.threatened)}</strong> classified as
            threatened, the figure is{" "}
            <strong className="text-ink">
              {fmtPct(stats.threatenedWithGenome, stats.threatened)}
            </strong>
            .
          </Prose>
        )}
      </div>

      <section className="space-y-3">
        <H2>How this is built</H2>
        <Prose>
          No single database knows both a species&rsquo; conservation status and whether it has
          been sequenced. This tool joins three open datasets, each published as a versioned,
          content-addressed collection on the Underlay, and reconciles them through the GBIF
          taxonomic backbone so names line up across sources.
        </Prose>
        <ul className="space-y-2 text-[14px] text-ink-soft">
          <li>
            <strong className="text-ink">Conservation status</strong> — the IUCN Red List, via
            the GBIF-hosted checklist (categories CR, EN, VU, NT, LC, DD, EW, EX).
          </li>
          <li>
            <strong className="text-ink">Genome availability</strong> — genome assemblies in
            NCBI Datasets, matched to each species and summarised to the best assembly level.
          </li>
          <li>
            <strong className="text-ink">Reconciliation</strong> — the GBIF backbone taxonomy,
            which bridges the differing names and synonyms used by IUCN and NCBI.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <H2>Scope &amp; caveats</H2>
        <Prose>
          The universe is IUCN-assessed <em>vertebrates</em> (phylum Chordata) — a deliberate
          starting scope; invertebrates, plants, and fungi can be added as further collections.
          Genome matching is by canonical species name, so a handful of records may be missed
          where a name differs from NCBI&rsquo;s, and a species counts as &ldquo;having a
          genome&rdquo; if any assembly (including a subspecies&rsquo;) exists. Status reflects the
          IUCN Red List snapshot at build time.
        </Prose>
      </section>

      {meta && (
        <section className="space-y-3">
          <H2>Data sources</H2>
          <div className="overflow-hidden rounded-lg border border-line">
            {Object.values(meta.sources).map((src) => (
              <a
                key={src.collection}
                href={`${underlay}/${src.collection}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[13px] last:border-b-0 hover:bg-surface-2"
              >
                <span className="font-mono text-genome">{src.collection}</span>
                <span className="flex items-center gap-2 text-muted">
                  {src.version}
                  <ExternalLink size={13} />
                </span>
              </a>
            ))}
          </div>
          <p className="text-[12px] text-faint">
            Built {new Date(meta.generatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            . Conservation status originates with the{" "}
            <a
              href="https://www.iucnredlist.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line-strong underline-offset-2 hover:decoration-forest"
            >
              IUCN Red List
            </a>
            ; please observe its terms for downstream use.
          </p>
        </section>
      )}
    </div>
  );
}
