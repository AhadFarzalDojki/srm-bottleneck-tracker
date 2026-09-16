/**
 * The four headline figures. Server component -- these are static numbers.
 *
 * Each stat carries its own qualifier line, because every one of them is easy to
 * over-read: the share is of award dollars (not motors produced), and the growth
 * multiple compares multi-year averages (not two cherry-picked years).
 */
import { fyRange, pct, signals, usd } from "@/lib/signals";

function Stat({
  value,
  label,
  note,
  emphasis = false,
}: {
  value: string;
  label: string;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <span
        className={`tnum text-[26px] font-semibold leading-none tracking-tight sm:text-[30px] ${
          emphasis ? "text-[var(--primary)]" : ""
        }`}
      >
        {value}
      </span>
      <span className="mt-1 text-[13px] font-medium">{label}</span>
      <span className="text-[12px] leading-snug text-[var(--faint)]">{note}</span>
    </div>
  );
}

export function StatRow() {
  const {
    concentration: c,
    concentration_psc1337: cPsc,
    surge: s,
    psc_mix: mix,
    program_dependency: prog,
    windows,
  } = signals;
  const leader = c.groups[0];

  /* These four carry the whole argument in order: procurement surged, it narrowed to
     one group, it is not actually propulsion, and the line that IS propulsion is
     effectively single-source. */
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        value={`${s.multiple}×`}
        label="Growth in DoD obligations to these manufacturers"
        note={`${fyRange(s.baseline_fys)} average ${usd(s.baseline_avg)} → ${fyRange(
          s.recent_fys
        )} average ${usd(s.recent_avg)}. ${prog.surge_multiple_ex_award}× excluding the single largest contract.`}
      />
      <Stat
        emphasis
        value={pct(c.top1_share)}
        label={`${leader.group} — share of those dollars`}
        note={`${windows.concentration}. HHI ${c.hhi.toLocaleString()} against the ${c.hhi_threshold} DOJ/FTC benchmark — a descriptive yardstick, not a market definition.`}
      />
      <Stat
        /* Two decimals: at sub-1% a single decimal rounds 0.32% to 0.3% and loses
           precision the written analysis quotes exactly. */
        value={pct(mix.propulsion_share, 2)}
        label="…that is actually propulsion, by product code"
        note={`${usd(mix.propulsion_total)} of ${usd(
          mix.total
        )}. The rest is complete missiles, launchers and missile systems.`}
      />
      <Stat
        emphasis
        value={pct(cPsc.top1_share)}
        /* "Largest supplier" rather than "single-source": the term is defined on the
           page, but a stat tile is read out of context and should not imply a
           market-structure claim on its own. */
        label="Largest supplier — share of the real motor code"
        note={`PSC 1337, ${usd(cPsc.total)} over the window, HHI ${cPsc.hhi.toLocaleString()} across ${cPsc.owner_groups} groups.`}
      />
    </div>
  );
}
