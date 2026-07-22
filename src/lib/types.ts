export interface Species {
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

export interface Assembly {
  accession: string;
  name: string;
  level: string;
  refseq: boolean;
  year: string;
  submitter: string;
  contigN50: number | null;
  ncbiTaxId: number | null;
}

export type AssembliesByKey = Record<string, Assembly[]>;

export interface CategoryStat {
  code: string;
  label: string;
  total: number;
  withGenome: number;
}

export interface ClassStat {
  name: string;
  total: number;
  withGenome: number;
}

export interface Stats {
  total: number;
  withGenome: number;
  threatened: number;
  threatenedWithGenome: number;
  byCategory: CategoryStat[];
  byClass: ClassStat[];
  byLevel: Array<{ level: string; count: number }>;
}

export interface Meta {
  generatedAt: string;
  sources: Record<string, { collection: string; version: string }>;
  underlayUrl: string;
}

export type GenomeFilter = "all" | "yes" | "no";

export interface Filters {
  query: string;
  cats: string[];
  classes: string[];
  threatenedOnly: boolean;
  genome: GenomeFilter;
}

export const EMPTY_FILTERS: Filters = {
  query: "",
  cats: [],
  classes: [],
  threatenedOnly: false,
  genome: "all",
};
