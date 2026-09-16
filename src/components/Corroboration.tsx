/**
 * Independent corroboration, verified against primary sources.
 *
 * Every claim in this section was checked against the source document rather than a
 * search summary, and that pass changed five things:
 *
 *  - GAO-18-45 is dated OCTOBER 2017, not 2018 (the number is fiscal-year based). It is
 *    nearly a decade old and is a baseline, not recent confirmation.
 *  - GAO named the two manufacturers as Aerojet Rocketdyne and ORBITAL ATK. Northrop
 *    acquired Orbital ATK in June 2018, after the report. Saying GAO named Northrop
 *    would be wrong.
 *  - The 5,000 -> 1,000 supplier decline is one manufacturer's ESTIMATE of its sub-tier
 *    supplier base reported to GAO, not a GAO count.
 *  - The "two manufacturers" point is a senior DoD industrial-base-policy official's
 *    statement to GAO, and its actual content is that DoD needs require two but demand
 *    cannot keep three viable.
 *  - The strongest congressional citation is not a bill at all: Section 866 of the
 *    FY2025 NDAA is enacted law. S.5556 died in committee and is kept only as a
 *    secondary signal, explicitly labelled as never enacted.
 */
import { Card } from "./Chrome";
import { pct, signals } from "@/lib/signals";

type Source = {
  href: string;
  cite: string;
  date: string;
  title: string;
  status?: string;
  finding: string;
};

const BASELINE: Source[] = [
  {
    href: "https://www.gao.gov/products/gao-18-45",
    cite: "GAO-18-45",
    date: "October 2017",
    title: "Solid Rocket Motors: DOD and Industry Are Addressing Challenges",
    finding:
      "Reports that since 1995 the industry consolidated from six US manufacturers to " +
      "two — which GAO names as Aerojet Rocketdyne and Orbital ATK, the latter acquired " +
      "by Northrop Grumman the following year. A manufacturer separately estimated to " +
      "GAO that its sub-tier supplier base fell from roughly 5,000 to about 1,000 over " +
      "twenty years. And a senior DoD industrial-base-policy official told GAO that " +
      "current DoD needs require two SRM manufacturers, but that there is not enough " +
      "demand to keep three companies economically viable.",
  },
];

const CURRENT: Source[] = [
  {
    href: "https://www.congress.gov/118/plaws/publ159/PLAW-118publ159.pdf",
    cite: "Sec. 866, FY2025 NDAA",
    date: "Public Law 118-159, 23 December 2024",
    title: "Solid rocket motor industrial base",
    status: "Enacted law",
    finding:
      "Requires the Under Secretary of Defense for Acquisition and Sustainment to " +
      "submit a strategy for ensuring the industrial base can meet requirements for " +
      "programs of record relating to solid rocket motors, and directs the Secretary " +
      "of Defense to seek an FFRDC review of that base — including the capacity of " +
      "existing manufacturers to expand, the capability of potential new entrants, and " +
      "the process for qualifying them. Congress legislated an assessment of exactly " +
      "the constraint this data describes.",
  },
  {
    href: "https://www.war.gov/News/Releases/Release/Article/4316035/department-of-war-awards-335-million-to-increase-solid-rocket-motor-capacity-an/",
    cite: "DPA Title III awards",
    date: "26 September 2025",
    title: "$33.5 million to increase solid rocket motor capacity",
    status: "Money obligated",
    finding:
      "Two Defense Production Act Title III awards: $12.6 million to Americarb for " +
      "carbonized rayon phenolic, the ablative material that insulates rocket nozzles, " +
      "and $20.9 million to General Dynamics Ordnance and Tactical Systems to add " +
      "nozzle production capacity — explicitly to become a new supplier of composite " +
      "rocket nozzles and insulators. The department is paying to widen a supplier base " +
      "it considers too narrow.",
  },
];

function SourceCard({ s }: { s: Source }) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <a
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-[var(--primary)] underline decoration-[var(--primary-soft)] decoration-2 underline-offset-2 hover:decoration-[var(--primary)]"
        >
          {s.cite}
        </a>
        <span className="text-[12px] text-[var(--faint)]">{s.date}</span>
        {s.status && (
          <span className="rounded border border-[var(--border)] px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            {s.status}
          </span>
        )}
      </div>
      <p className="mb-2 text-[12.5px] italic text-[var(--faint)]">{s.title}</p>
      <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">{s.finding}</p>
    </Card>
  );
}

export function Corroboration() {
  const northrop = signals.concentration_psc1337.groups.find((g) =>
    g.group.includes("Northrop")
  );
  const ut = signals.geography.states.find((s) => s.state === "UT");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--faint)]">
          The baseline — and it is old
        </h3>
        <p className="mb-3 max-w-2xl text-[13.5px] leading-relaxed text-[var(--muted)]">
          The standard reference on this industrial base predates the buildup by five
          years. It establishes the starting structure; it is not a recent confirmation
          of anything, and should not be read as one.
        </p>
        <div className="space-y-3">
          {BASELINE.map((s) => (
            <SourceCard key={s.cite} s={s} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--faint)]">
          Current government action
        </h3>
        <p className="mb-3 max-w-2xl text-[13.5px] leading-relaxed text-[var(--muted)]">
          These are recent, and they are what make the old baseline relevant: the
          government is still legislating and spending against this constraint.
        </p>
        <div className="space-y-3">
          {CURRENT.map((s) => (
            <SourceCard key={s.cite} s={s} />
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-[var(--faint)]">
          A companion bill, S.5556, would have required a similar strategy. Sen. John
          Cornyn introduced it on 17 December 2024; it was referred to the Senate Armed
          Services Committee, gathered no cosponsors, and died there when the 118th
          Congress ended. It never became law and is noted only as an additional signal
          of attention.
        </p>
      </div>

      <Card className="border-[var(--primary-soft)] p-4">
        <h3 className="mb-1.5 text-[14px] font-semibold">
          The one discrepancy, confronted
        </h3>
        <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
          GAO describes a <strong className="text-[var(--text)]">two</strong>-manufacturer
          base. The motor code here shows one supplier at{" "}
          {pct(signals.concentration_psc1337.top1_share)} — and Northrop Grumman, which
          now owns the Orbital ATK business GAO named as the second manufacturer, at{" "}
          <strong className="text-[var(--text)]">{pct(northrop?.share ?? 0)}</strong>.
          Utah, where its largest motor plant sits, receives {pct(ut?.share ?? 0)} of the
          primary lens.
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
