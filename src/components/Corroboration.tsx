/**
 * Independent corroboration.
 *
 * The single highest-leverage thing on this page. Everything else asks a reader to
 * trust an analysis they have never seen before; this section shows that the
 * concentration it finds in contract data is already documented by the government.
 *
 * It also confronts the one apparent discrepancy rather than omitting it: GAO describes
 * a two-manufacturer base, while the motor code shows one supplier at ~90% and the
 * other at ~3%. That gap is the thesis, not a problem with it.
 */
import { Card } from "./Chrome";
import { pct, signals } from "@/lib/signals";

const SOURCES = [
  {
    href: "https://www.gao.gov/products/gao-18-45",
    cite: "GAO-18-45",
    title: "Solid Rocket Motors: DOD and Industry Are Addressing Challenges",
    finding:
      "Since 1995 the US solid rocket motor industry consolidated from six " +
      "manufacturers to two. One manufacturer's own supplier base fell from roughly " +
      "5,000 firms to about 1,000 over twenty years. The report also records DoD's " +
      "position that current SRM demand can only sustain two manufacturers.",
  },
  {
    href: "https://www.congress.gov/bill/118th-congress/senate-bill/5556/text",
    cite: "S.5556, 118th Congress",
    title: "A bill to require a solid rocket motor industrial base strategy",
    finding:
      "Would have required a solid rocket motor industrial base strategy, including a " +
      "federally funded review of the existing base's capacity to expand. Congress has " +
      "treated this as a live problem, not a hypothetical one.",
  },
  {
    href: "https://www.war.gov/News/Releases/Release/Article/4316035/department-of-war-awards-335-million-to-increase-solid-rocket-motor-capacity-an/",
    cite: "DPA Title III, September 2025",
    title: "$33.5 million to increase solid rocket motor capacity",
    finding:
      "Defense Production Act Title III awards aimed specifically at expanding solid " +
      "rocket motor production capacity — the department spending money against the " +
      "same constraint this data describes.",
  },
];

export function Corroboration() {
  const northrop = signals.concentration_psc1337.groups.find((g) =>
    g.group.includes("Northrop")
  );
  const ut = signals.geography.states.find((s) => s.state === "UT");

  return (
    <div className="space-y-3">
      {SOURCES.map((s) => (
        <Card key={s.cite} className="p-4">
          <div className="mb-1 flex flex-wrap items-baseline gap-x-2.5">
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-[var(--primary)] underline decoration-[var(--primary-soft)] decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
            >
              {s.cite}
            </a>
            <span className="text-[12.5px] text-[var(--faint)]">{s.title}</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
            {s.finding}
          </p>
        </Card>
      ))}

      <Card className="border-[var(--primary-soft)] p-4">
        <h3 className="mb-1.5 text-[14px] font-semibold">
          The one discrepancy, confronted
        </h3>
        <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
          GAO describes a <strong className="text-[var(--text)]">two</strong>-manufacturer
          base: Aerojet Rocketdyne and Northrop Grumman. The motor code here shows one
          supplier at {pct(signals.concentration_psc1337.top1_share)} — and Northrop, the
          other half of that documented duopoly, at{" "}
          <strong className="text-[var(--text)]">
            {pct(northrop?.share ?? 0)}
          </strong>
          . Utah, where Northrop&apos;s largest motor plant sits, receives{" "}
          {pct(ut?.share ?? 0)} of the primary lens.
        </p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--muted)]">
          That is not a contradiction of GAO. It is the same conclusion reached from
          another direction: Northrop&apos;s motor production flows into its own missile
          programs and into subcontracts, neither of which appears as separately-coded
          motor procurement. A duopoly exists in the industrial base; only one member of
          it is visible in the public line that names motors. Using this data alone to map
          the motor supply base, you would miss half of it.
        </p>
      </Card>
    </div>
  );
}
