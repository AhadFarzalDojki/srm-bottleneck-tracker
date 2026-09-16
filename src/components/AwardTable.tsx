/**
 * Award-level drill-down.
 *
 * The amount column is deliberately labelled "total contract value", not a period
 * figure: the award-search endpoint returns whole-contract value, and its date filter
 * matches any transaction in the window, so contracts signed years before the window
 * appear here at full value. That is exactly why these rows are never summed -- see
 * the method note on the page and the assertion in scripts/build_signals.py.
 */
import { signals, usd } from "@/lib/signals";

export function AwardTable({
  which = "fy23",
  limit = 8,
}: {
  which?: "fy23" | "fy20_25";
  limit?: number;
}) {
  const rows = signals.awards[which].slice(0, limit);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-left">
            <th className="px-4 py-2.5 font-medium text-[var(--muted)]">Recipient</th>
            <th className="px-4 py-2.5 font-medium text-[var(--muted)]">
              Total contract value
            </th>
            <th className="px-4 py-2.5 font-medium text-[var(--muted)]">Performance</th>
            <th className="px-4 py-2.5 font-medium text-[var(--muted)]">What it buys</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.award_id}-${r.start}`}
              className="border-b border-[var(--border)] last:border-0 align-top"
            >
              <td className="px-4 py-2.5">
                <div className="font-medium">{r.recipient}</div>
                <div className="tnum text-[11.5px] text-[var(--faint)]">
                  {r.award_id}
                  {r.state ? ` · ${r.state}` : ""}
                </div>
              </td>
              <td className="tnum whitespace-nowrap px-4 py-2.5">
                {usd(r.total_contract_value)}
              </td>
              <td className="tnum whitespace-nowrap px-4 py-2.5 text-[var(--muted)]">
                {r.start?.slice(0, 7)} → {r.end?.slice(0, 7)}
              </td>
              {/* Verbatim. An earlier version sentence-cased these, which turned
                  "MK 41 MOD 36 VLS MODULE" into "Mk 41 mod 36 vls module" and
                  mangled every program acronym and part number in the data. These
                  are the government's own contract descriptions; they are quoted,
                  not rewritten. */}
              <td className="px-4 py-2.5 text-[12.5px] leading-snug text-[var(--muted)]">
                {r.description || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
