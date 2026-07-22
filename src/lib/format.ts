export const CATEGORY_LABEL: Record<string, string> = {
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

/** CSS var name for each IUCN category colour (defined in global.css @theme). */
export const CATEGORY_COLOR: Record<string, string> = {
  EX: "var(--color-ex)",
  EW: "var(--color-ew)",
  CR: "var(--color-cr)",
  EN: "var(--color-en)",
  VU: "var(--color-vu)",
  NT: "var(--color-nt)",
  DD: "var(--color-dd)",
  LC: "var(--color-lc)",
  NE: "var(--color-ne)",
};

export const ASSEMBLY_LEVEL_SHORT: Record<string, string> = {
  "Complete Genome": "Complete",
  Chromosome: "Chromosome",
  Scaffold: "Scaffold",
  Contig: "Contig",
};

export function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

export function fmtPct(part: number, whole: number, digits = 1): string {
  return `${pct(part, whole).toFixed(digits)}%`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}
