/**
 * Tier-2 visibility, presented as the partial evidence it actually is.
 *
 * This panel exists to answer the obvious objection to everything above it: if
 * Lockheed is an integrator rather than a motor manufacturer, who actually builds
 * the motors? Prime-award data cannot answer that. Subaward data can only gesture
 * at it, for three reasons stated on the page itself:
 *
 *   - FSRS subaward reporting is incomplete and threshold-based
 *   - only first-tier subawards are reported at all, and motor supply can sit deeper
 *   - raw rows repeat across contract modifications (deduped in build_signals.py)
 *
 * Showing this honestly is better than omitting it and letting a reader assume the
 * prime-level concentration figure describes manufacturing.
 */
import { Card } from "./Chrome";
import { signals, usd } from "@/lib/signals";

function Panel({ lensKey, title, blurb }: { lensKey: string; title: string; blurb: string }) {
  const s = signals.subawards[lensKey];
  if (!s) return null;

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        <span className="tnum shrink-0 text-[11.5px] text-[var(--faint)]">
          {s.rows_after_dedupe} rows{" "}
          {s.duplicates_removed > 0 && `(${s.duplicates_removed} dupes removed)`}
        </span>
      </div>
      <p className="mb-3 text-[12.5px] leading-relaxed text-[var(--muted)]">{blurb}</p>
      <ol className="space-y-1.5">
        {s.top.slice(0, 6).map((r) => (
          <li key={r.subawardee} className="flex items-baseline gap-3 text-[13px]">
            <span className="tnum w-16 shrink-0 text-right text-[var(--muted)]">
              {usd(r.amount, 1)}
            </span>
            <span className="min-w-0">
              <span className="font-medium">{r.subawardee}</span>
              {r.primes.length > 0 && (
                <span className="text-[var(--faint)]"> · via {r.primes[0]}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function SubawardPanel() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Panel
        lensKey="psc1337"
        title="Under PSC 1337 (solid-fuel motor code)"
        blurb="Filtered to the motor-specific product code, the subaward layer does surface an actual propulsion supplier sitting beneath a prime integrator — which is the relationship the prime-level chart cannot show."
      />
      <Panel
        lensKey="dod_336415"
        title="Under NAICS 336415 (primary lens)"
        blurb="Under the broader lens the largest reported subawardees are machining and subsystem firms, not motor manufacturers. Shown as-is: it is evidence that this code covers more than propulsion, not evidence about who makes motors."
      />
    </div>
  );
}
