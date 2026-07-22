import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import type { Species, Assembly } from "~/lib/types";
import { loadAssemblies } from "~/lib/data";
import { CATEGORY_COLOR, CATEGORY_LABEL, ASSEMBLY_LEVEL_SHORT, fmtInt } from "~/lib/format";

const NCBI_TAXON = (id: number) => `https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${id}/`;
const NCBI_GENOME = (acc: string) => `https://www.ncbi.nlm.nih.gov/datasets/genome/${acc}/`;
const GBIF_SPECIES = (key: number) => `https://www.gbif.org/species/${key}`;
const IUCN_SEARCH = (name: string) =>
  `https://www.iucnredlist.org/search?query=${encodeURIComponent(name)}&searchType=species`;
const NCBI_SEARCH = (name: string) =>
  `https://www.ncbi.nlm.nih.gov/datasets/genome/?taxon=${encodeURIComponent(name)}`;

function IdRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-muted">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1 font-mono text-[12px] text-genome hover:underline"
      >
        {value}
        <ExternalLink size={11} className="opacity-60 transition-opacity group-hover:opacity-100" />
      </a>
    </div>
  );
}

function AssemblyItem({ a }: { a: Assembly }) {
  return (
    <li className="border-t border-line py-2 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <a
          href={NCBI_GENOME(a.accession)}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 font-mono text-[12px] text-genome hover:underline"
        >
          {a.accession}
          <ExternalLink size={11} className="opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
        {a.refseq && (
          <span className="rounded bg-genome-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-genome">
            RefSeq
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[12px] text-muted">
        {ASSEMBLY_LEVEL_SHORT[a.level] ?? a.level}
        {a.year && <span> · {a.year}</span>}
        {a.contigN50 !== null && <span> · contig N50 {fmtInt(a.contigN50)}</span>}
      </div>
      {a.submitter && <div className="text-[11px] text-faint">{a.submitter}</div>}
    </li>
  );
}

export function SpeciesDetail({ species, onClose }: { species: Species; onClose: () => void }) {
  const [assemblies, setAssemblies] = useState<Assembly[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    if (species.hasGenome) {
      loadAssemblies().then((map) => {
        if (live) setAssemblies(map[String(species.key)] ?? []);
      });
    } else {
      setAssemblies([]);
    }
    return () => {
      live = false;
    };
  }, [species.key, species.hasGenome]);

  const color = CATEGORY_COLOR[species.cat] ?? "var(--color-ne)";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-forest-deep/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <div className="font-display text-[22px] font-semibold leading-tight text-ink">
              {species.common || species.sci}
            </div>
            {species.common && (
              <div className="text-[14px] italic text-muted">{species.sci}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded p-1 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            <span className="font-medium" style={{ color }}>
              {CATEGORY_LABEL[species.cat] ?? species.cat}
            </span>
            {species.threatened && <span className="text-[12px] text-muted">· threatened</span>}
          </div>

          {/* Taxonomy */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Taxonomy
            </div>
            <div className="text-[13px] text-ink-soft">
              {[species.class, species.order, species.family, species.genus]
                .filter(Boolean)
                .join("  ›  ")}
            </div>
          </div>

          {/* Identifiers */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Identifiers
            </div>
            <div className="divide-y divide-line">
              <IdRow label="GBIF backbone" value={String(species.key)} href={GBIF_SPECIES(species.key)} />
              {species.ncbiTaxId !== null && (
                <IdRow label="NCBI Taxonomy" value={String(species.ncbiTaxId)} href={NCBI_TAXON(species.ncbiTaxId)} />
              )}
              <IdRow label="IUCN Red List" value="search ↗" href={IUCN_SEARCH(species.sci)} />
            </div>
          </div>

          {/* Genomes */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                Reference genomes
              </span>
              {species.hasGenome && (
                <span className="text-[12px] text-muted">
                  {fmtInt(species.asmCount)} {species.asmCount === 1 ? "assembly" : "assemblies"}
                </span>
              )}
            </div>
            {!species.hasGenome ? (
              <p className="text-[13px] text-ink-soft">
                No genome assembly in NCBI.{" "}
                <a
                  href={NCBI_SEARCH(species.sci)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-genome hover:underline"
                >
                  Search NCBI
                </a>
              </p>
            ) : assemblies === null ? (
              <p className="text-[13px] text-faint">Loading assemblies…</p>
            ) : (
              <ul>
                {assemblies.map((a) => (
                  <AssemblyItem key={a.accession} a={a} />
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-line px-6 py-4 text-[11px] text-faint">
          Joined from <span className="font-mono">reviverestore/iucn-species</span>,{" "}
          <span className="font-mono">gbif-backbone</span>, and{" "}
          <span className="font-mono">ncbi-assemblies</span> on the Underlay.
        </div>
      </div>
    </div>
  );
}
