/**
 * What the primary lens actually buys, as a single composition bar.
 *
 * This section exists because of a correction. An earlier version of this analysis
 * described NAICS 336415 dollars as "propulsion spending" -- the code is, after all,
 * named "Guided Missile and Space Vehicle Propulsion Unit and Propulsion Unit Parts
 * Manufacturing". Checking the product codes showed that is not what the money buys.
 *
 * A single stacked bar is the right form here: the claim is entirely about relative
 * proportion, and the propulsion sliver has to be visibly a sliver. A grouped bar
 * chart or a table would let the reader miss the point that it rounds to nothing.
 *
 * Pure CSS rather than recharts -- one bar with four segments needs no chart library.
 */
import { Card } from "./Chrome";
import { pct, signals, usd } from "@/lib/signals";

export function PscMix() {
  const mix = signals.psc_mix;
  const shown = mix.codes.slice(0, 3);
  const restShare = 100 - shown.reduce((a, c) => a + c.share, 0);

  const segments = [
    ...shown.map((c, i) => ({
      key: c.code,
      label: c.name,
      code: c.code,
      share: c.share,
      amount: c.amount,
      color: ["var(--primary)", "var(--control)", "var(--secondary)"][i],
    })),
    {
      key: "rest",
      label: "Everything else (R&D services, components, support)",
      code: "—",
      share: restShare,
      amount: mix.total * (restShare / 100),
      color: "var(--primary-soft)",
    },
  ];

  return (
    <Card className="p-4 pt-5">
      {/* The bar itself. min-width keeps the smallest segment visible as a hairline
          rather than collapsing to zero and disappearing. */}
      <div
        className="flex h-11 w-full overflow-hidden rounded-md"
        role="img"
        aria-label={segments
          .map((s) => `${s.code} ${s.label}: ${pct(s.share)}`)
          .join("; ")}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-center"
            style={{
              width: `${s.share}%`,
              minWidth: 2,
              background: s.color,
            }}
            title={`${s.code} — ${s.label}: ${pct(s.share)} (${usd(s.amount)})`}
          >
            {s.share > 8 && (
              <span className="tnum px-1 text-[12px] font-semibold text-[var(--surface)]">
                {pct(s.share, 0)}
              </span>
            )}
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-baseline gap-2.5 text-[13px]">
            <span
              className="mt-[5px] size-2.5 shrink-0 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="tnum w-12 shrink-0 text-right font-medium">
              {pct(s.share)}
            </span>
            <span className="min-w-0">
              <span className="font-medium">{s.label}</span>
              {s.code !== "—" && (
                <span className="text-[var(--faint)]"> · PSC {s.code}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* The punchline, given its own emphasis rather than left in the list. */}
      <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
        <p className="text-[14px] leading-relaxed">
          <strong className="text-[var(--alert)]">
            Propulsion product codes account for {pct(mix.propulsion_share)} of this
            category
          </strong>{" "}
          — {usd(mix.propulsion_total)} of {usd(mix.total)} — and that figure is
          deliberately generous, counting rocket ammunition (PSC 1340) and
          propellant-actuated devices such as ejection-seat cartridges (PSC 1377)
          alongside the two codes that genuinely describe missile propulsion.
        </p>
      </div>
    </Card>
  );
}
