/**
 * Typed access to data/signals.json, the single source of truth.
 *
 * Nothing in the UI recomputes a figure from raw API data -- every number rendered
 * comes from this file, which is produced by scripts/build_signals.py. Keep it that
 * way: it is what makes each published figure traceable back to a named filter.
 */
import raw from "../../data/signals.json";

export type FyRow = {
  fy: number;
  dod_336415?: number;
  nasa_336415?: number;
  psc1337?: number;
};

export type OwnerGroup = {
  group: string;
  amount: number;
  share: number;
  entities: number;
  entity_names: string[];
  ownership_note: string | null;
};

export type Concentration = {
  total: number;
  net_total: number;
  negative_recipients: number;
  deobligated: number;
  recipient_entities: number;
  owner_groups: number;
  top1_share: number;
  top3_share: number;
  hhi: number;
  hhi_threshold: number;
  unrolled_top1_share: number;
  groups: OwnerGroup[];
};

export type Surge = {
  baseline_fys: number[];
  baseline_avg: number;
  recent_fys: number[];
  recent_avg: number;
  multiple: number | null;
  peak_fy: number;
  peak: number;
  latest_fy: number;
  latest: number;
  control_baseline_avg: number;
  control_recent_avg: number;
  control_multiple: number | null;
};

export type StateRow = {
  state: string;
  name: string;
  amount: number;
  share: number;
  note: string | null;
};

export type SubawardTop = {
  subawardee: string;
  amount: number;
  subawards: number;
  primes: string[];
};

export type Subawards = {
  rows_returned: number;
  rows_after_dedupe: number;
  duplicates_removed: number;
  visible_total: number;
  complete: boolean;
  top: SubawardTop[];
};

export type AwardRow = {
  award_id: string | null;
  recipient: string;
  total_contract_value: number | null;
  start: string | null;
  end: string | null;
  state: string | null;
  naics: string | null;
  psc: string | null;
  description: string;
};

export type Check = {
  name: string;
  passed: boolean;
  detail: string;
  [k: string]: unknown;
};

export type PscMix = {
  total: number;
  codes: {
    code: string;
    name: string;
    amount: number;
    share: number;
    is_propulsion: boolean;
  }[];
  propulsion_codes: string[];
  propulsion_total: number;
  propulsion_share: number;
  non_propulsion_share: number;
  top3_share: number;
};

export type ProgramDependency = {
  award_id: string | null;
  recipient: string;
  description: string;
  program: string;
  psc: string | null;
  date_signed: string | null;
  total_contract_value: number | null;
  obligated_to_date: number;
  years: { fy: number; award: number; lens: number; share_of_fy: number | null }[];
  share_of_window: number;
  peak_fy_share: number | null;
  surge_multiple_ex_award: number | null;
  recent_avg_ex_award: number;
};

export type ConcentrationExAward = {
  removed_award: string | null;
  removed_amount: number;
  attributed_to: string;
  total: number;
  top1_share: number;
  top1_group: string;
  top3_share: number;
  hhi: number;
  still_highly_concentrated: boolean;
  groups: { group: string; amount: number; share: number }[];
};

export type AcquisitionTiming = {
  boundary: string;
  boundary_note: string;
  concentration_predates_acquisition: boolean;
  pre: AcqWindow;
  post: AcqWindow;
};

export type AcqWindow = {
  total: number;
  entities: number;
  top_entity: string;
  top_amount: number;
  top_share: number;
};

export type Signals = {
  generated: string;
  source: string;
  lens_labels: Record<string, string>;
  windows: { series: string; concentration: string };
  series: FyRow[];
  surge: Surge;
  concentration: Concentration;
  concentration_psc1337: Concentration;
  geography: { total: number; states: StateRow[]; top4_share: number };
  psc_mix: PscMix;
  program_dependency: ProgramDependency;
  concentration_ex_top_award: ConcentrationExAward;
  acquisition_timing: AcquisitionTiming;
  subawards: Record<string, Subawards>;
  awards: { fy20_25: AwardRow[]; fy23: AwardRow[] };
  checks: Check[];
};

export const signals = raw as unknown as Signals;

/** Compact dollars: $1.47B / $405M / $8.5M. Used in every chart axis and stat. */
export function usd(n: number | null | undefined, digits?: number): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(digits ?? 2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(digits ?? 0)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/**
 * Axis-tick dollars. Billions keep one decimal so a $0.5B/$1.0B/$1.5B axis does not
 * collapse to a row of identical "$1B" ticks; millions stay whole.
 */
export function usdAxis(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(digits)}%`;
}

/** "FY2016-FY2019" from [2016,2017,2018,2019]. */
export function fyRange(fys: number[]): string {
  if (!fys.length) return "";
  return `FY${fys[0]}–FY${fys[fys.length - 1]}`;
}
