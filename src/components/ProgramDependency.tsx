/**
 * How much of the "surge" is a single contract.
 *
 * Any reporter shown a twentyfold rise will ask whether it is one program ramping.
 * It largely is: the Army's Air-to-Ground Missile Systems contract with Lockheed
 * Martin (JAGM and HELLFIRE production) is about half the entire window and roughly
 * two-thirds of every post-inflection year. Publishing the ex-contract multiple
 * alongside the headline one is the difference between a finding that survives
 * scrutiny and a finding that collapses under the first question.
 *
 * The per-year figures come from the transaction endpoint, not the award search --
 * see program_dependency() in scripts/build_signals.py.
 */
import { Card } from "./Chrome";
import { pct, signals, usd } from "@/lib/signals";

export function ProgramDependency() {
  const p = signals.program_dependency;
  const s = signals.surge;
  const ex = signals.concentration_ex_top_award;
  const maxLens = Math.max(...p.years.map((y) => y.lens));

  return (
    <Card className="p-4 pt-5">
      <h3 className="text-[15px] font-semibold">
        Half of it is one contract: {p.award_id}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
        {p.program}, awarded to {p.recipient} on {p.date_signed} and coded PSC {p.psc}{" "}
        (Guided Missiles). It accounts for{" "}
        <strong className="text-[var(--text)]">
          {pct(p.share_of_window)} of the entire {signals.windows.concentration} window
        </strong>
        .
      </p>

      {/* Per-year: the shaded portion is this one award inside that year's total. */}
      <ul className="mt-5 space-y-3">
        {p.years.map((y) => (
          <li key={y.fy}>
            <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
              <span className="font-medium">FY{y.fy}</span>
              <span className="tnum text-[var(--muted)]">
                {usd(y.award)} of {usd(y.lens)}
                {y.share_of_fy !== null && (
                  <span className="ml-1.5 font-semibold text-[var(--primary)]">
                    {pct(y.share_of_fy, 0)}
                  </span>
                )}
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--primary-soft)]"
              style={{ maxWidth: `${(y.lens / maxLens) * 100}%` }}
            >
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${(y.award / y.lens) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Both robustness checks together: does the growth finding survive removing
          this contract, and does the concentration finding? */}
      <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-left">
              <th className="px-3 py-2 font-medium text-[var(--muted)]">Finding</th>
              <th className="px-3 py-2 font-medium text-[var(--muted)]">
                All contracts
              </th>
              <th className="px-3 py-2 font-medium text-[var(--muted)]">
                Excluding {p.award_id}
              </th>
            </tr>
          </thead>
          <tbody className="tnum">
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2">Growth multiple</td>
              <td className="px-3 py-2 font-semibold">{s.multiple}×</td>
              <td className="px-3 py-2 font-semibold text-[var(--primary)]">
                {p.surge_multiple_ex_award}×
              </td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="px-3 py-2">Top-1 share</td>
              <td className="px-3 py-2 font-semibold">
                {pct(signals.concentration.top1_share)}
              </td>
              <td className="px-3 py-2 font-semibold text-[var(--primary)]">
                {pct(ex.top1_share)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">HHI</td>
              <td className="px-3 py-2 font-semibold">
                {signals.concentration.hhi.toLocaleString()}
              </td>
              <td className="px-3 py-2 font-semibold text-[var(--primary)]">
                {ex.hhi.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[var(--muted)]">
        Both findings survive the removal, which is the point of showing it.{" "}
        {p.surge_multiple_ex_award}× is still a steep rise, and an HHI of{" "}
        {ex.hhi.toLocaleString()} is still{" "}
        {ex.still_highly_concentrated ? "above" : "below"} the{" "}
        {signals.concentration.hhi_threshold} threshold for a highly concentrated
        market. But &ldquo;US missile procurement grew {s.multiple}×&rdquo; is
        substantially the story of one air-to-ground missile program scaling up, and
        both columns belong in any honest account.
      </p>

      <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--faint)]">
        Note the methodological trap this also illustrates: the award-search endpoint
        reports this contract as a single {usd(p.total_contract_value)} figure. Its
        transactions show that spread across three fiscal years. Same contract, and only
        the second view is period money.
      </p>
    </Card>
  );
}
