/**
 * Method and limits, stated on the page rather than buried in a repo README.
 *
 * The audience for this project is defense reporters and analysts, who will and
 * should check the filters before repeating a number. Listing the traps -- and the
 * assertions that guard against them -- is what makes the figures usable by someone
 * who did not build the pipeline.
 */
import { Card } from "./Chrome";
import { pct, signals } from "@/lib/signals";

const RULES: { title: string; body: string }[] = [
  {
    title: "Period dollars never come from the award-search endpoint",
    body:
      "USAspending's award search returns each contract's TOTAL value, and its date " +
      "filter matches any transaction in the window — so a contract signed in 2014 " +
      "appears in a FY2023 query at full value. Every dollar figure charted here comes " +
      "from the transaction-based endpoints instead. Award tables are labelled as total " +
      "contract value and are never summed.",
  },
  {
    title: "Recipients are rolled up to owner groups",
    body:
      "USAspending returns separate child registrations per division and location: " +
      "Lockheed Martin appears as several distinct entities. Unrolled, the leader reads " +
      `${pct(signals.concentration.unrolled_top1_share)}; correctly rolled up it is ` +
      `${pct(signals.concentration.top1_share)}. Rollup uses the API's parent-recipient ` +
      "field plus a small hand-maintained map for acquisitions (Orbital ATK→Northrop 2018, " +
      "Aerojet Rocketdyne→L3Harris 2023). That map reflects CURRENT ownership, so awards " +
      "won by Aerojet as an independent company are grouped under L3Harris.",
  },
  {
    title: "NAICS classifies the manufacturer; PSC classifies the purchase",
    body:
      "NAICS 336415 is named for propulsion-unit manufacturing, but it describes the " +
      "awardee's industry rather than the thing bought. By product code the category is " +
      `${signals.psc_mix.codes[0].share}% complete guided missiles, ` +
      `${signals.psc_mix.codes[1].share}% launchers and ` +
      `${signals.psc_mix.codes[2].share}% complete missile systems; propulsion codes are ` +
      `${signals.psc_mix.propulsion_share}% of it. An earlier version of this analysis ` +
      "called these dollars \"propulsion spending\" on the strength of the code's name. " +
      "That was wrong, and the build now asserts against it. Where NAICS and PSC disagree " +
      "about what a contract is for, PSC is the one that answers the question.",
  },
  {
    title: "The propulsion basket is drawn narrowly on purpose",
    body:
      "PSC 1337 (solid-fuel missile propulsion units) is treated as the motor line. PSC " +
      "1340 and 1377 are deliberately excluded from that reading: 1340 is rocket " +
      "ammunition — unguided and artillery rocket components — and 1377 is cartridge and " +
      "propellant actuated devices, whose largest recipient is an ejection-seat maker. " +
      "Both are propellant-adjacent and neither is missile propulsion. Including them " +
      "would roughly quadruple the apparent motor market and collapse the concentration " +
      "finding into noise. They are counted only in the deliberately generous " +
      "propulsion-share figure above, where a larger number is the conservative choice.",
  },
  {
    title: "HHI here is descriptive, not a market definition",
    body:
      "The Herfindahl–Hirschman Index on this page is computed on shares of award " +
      "dollars inside a procurement code. An antitrust HHI is computed on a defined " +
      "relevant market — a specific product, in a specific geography, with substitutes " +
      `analysed. This is not that. The ${signals.concentration.hhi_threshold} DOJ/FTC ` +
      "threshold is cited because it is the most widely understood yardstick for how " +
      "concentrated counts as concentrated, not because these figures establish " +
      "anything under the merger guidelines. No claim of market power, monopoly or " +
      "antitrust violation is intended or supported, and \"single-source\" and " +
      "\"highly concentrated\" should be read throughout as shorthand for measured " +
      "properties of federal award data.",
  },
  {
    title: "Shares use the positive-obligation denominator",
    body:
      `${signals.concentration_psc1337.negative_recipients} recipients net *negative* ` +
      "over the motor-code window — a deobligation larger than what was obligated in " +
      "the same period. A net-deobligating recipient is a zero, not a negative " +
      "competitor, so negatives are floored rather than netted. Left unfloored, a " +
      "single recipient's share exceeds 100% over the post-acquisition window and HHI " +
      "stops being well defined, since squaring a negative share adds to apparent " +
      `concentration. This affects only the motor code ($${(signals.concentration_psc1337.deobligated / 1e6).toFixed(1)}M ` +
      "deobligated); the primary lens has no negative recipients.",
  },
  {
    title: "The ownership map reflects current ownership, and is tested for it",
    body:
      "Aerojet Rocketdyne's awards are grouped under L3Harris, which acquired it on " +
      "28 July 2023 — including awards Aerojet won years earlier as an independent " +
      "company. That is the right lens for who controls a capability now and the wrong " +
      "one for who won work then, so the build splits the motor-code window at the " +
      `closing date: the same entity holds ${signals.acquisition_timing.pre.top_share}% ` +
      `before and ${signals.acquisition_timing.post.top_share}% after. The finding is ` +
      "not a retroactive merger artifact, and a check fails if that ever stops being true.",
  },
  {
    title: "Subaward coverage is partial",
    body:
      "First-tier subawards only, subject to reporting thresholds, and raw responses " +
      "repeat rows across contract modifications (deduplicated here by sub-award ID). " +
      "Absence of a supplier from the tier-2 panel is not evidence it is not in the " +
      "supply chain.",
  },
];

export function Method() {
  const { checks, source, generated, windows } = signals;

  return (
    <div className="space-y-3">
      {RULES.map((r) => (
        <Card key={r.title} className="p-4">
          <h3 className="mb-1.5 text-[14px] font-semibold">{r.title}</h3>
          <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">{r.body}</p>
        </Card>
      ))}

      <Card className="p-4">
        <h3 className="mb-2.5 text-[14px] font-semibold">
          Automated checks on the published figures
        </h3>
        <p className="mb-3 text-[13.5px] leading-relaxed text-[var(--muted)]">
          The build refuses to write new figures unless all of these pass, so the
          numbers on this page cannot drift from the rules above without the pipeline
          failing first.
        </p>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.name} className="flex gap-2.5 text-[13px]">
              <span
                className={`mt-px shrink-0 font-mono text-[11px] font-semibold ${
                  c.passed ? "text-[var(--secondary)]" : "text-[var(--alert)]"
                }`}
              >
                {c.passed ? "PASS" : "FAIL"}
              </span>
              {/* min-w-0 plus anywhere-wrapping: the assertion names are long
                  underscore_separated tokens, which do not break by default and pushed
                  the whole document into horizontal scroll on a phone. */}
              <span className="min-w-0">
                <code className="text-[12.5px] [overflow-wrap:anywhere]">{c.name}</code>
                <span className="block text-[var(--faint)]">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="pt-1 text-[12.5px] leading-relaxed text-[var(--faint)]">
        Source: {source}. No API key or authentication required — every figure here is
        reproducible from public data. Concentration window {windows.concentration};
        series window {windows.series}. Data pulled {generated}. Contract award types
        A–D (definitive contracts and purchase orders); indefinite-delivery vehicle
        ceilings are excluded so that unexercised capacity is not counted as spending.
      </p>
    </div>
  );
}
