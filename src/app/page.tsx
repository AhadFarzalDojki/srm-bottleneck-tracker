import { AwardTable } from "@/components/AwardTable";
import { Caveat, Card, Nav, Section } from "@/components/Chrome";
import { Corroboration } from "@/components/Corroboration";
import { ConcentrationChart } from "@/components/ConcentrationChart";
import { GeoChart } from "@/components/GeoChart";
import { Method } from "@/components/Method";
import { ProgramDependency } from "@/components/ProgramDependency";
import { PscMix } from "@/components/PscMix";
import { StatRow } from "@/components/StatRow";
import { SubawardPanel } from "@/components/SubawardPanel";
import { SurgeChart } from "@/components/SurgeChart";
import { fyRange, pct, signals, usd } from "@/lib/signals";

export default function Page() {
  const {
    concentration: c,
    concentration_psc1337: cPsc,
    surge: s,
    geography,
    psc_mix: mix,
    program_dependency: prog,
    acquisition_timing: acq,
  } = signals;
  const leader = c.groups[0];
  /* No arithmetic here. Every derived figure the page shows is computed once in
     scripts/build_signals.py and read from signals.json, so the dashboard and the
     write-ups cannot calculate the same thing two different ways. */
  const ml = signals.motor_line;
  const ut = geography.states.find((x) => x.state === "UT");
  const ar = geography.states.find((x) => x.state === "AR");

  const nav = [
    { id: "buildup", label: "The buildup" },
    { id: "concentration", label: "Concentration" },
    { id: "category", label: "What it buys" },
    { id: "motor-line", label: "The motor line" },
    { id: "geography", label: "Geography" },
    { id: "corroboration", label: "Corroboration" },
    { id: "limits", label: "Limits" },
    { id: "method", label: "Method" },
  ];

  return (
    <main>
      <Nav items={nav} />

      {/* ---------------- hero ---------------- */}
      <header>
        <div className="mx-auto w-full max-w-5xl px-5 pb-14 pt-12 sm:pt-16">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
            Public contract data · FY2016–FY2025
          </p>
          {/* Share and start year are interpolated, not written in: the share has
              already changed once (a deobligation-handling fix moved it from 92.2% to
              90.5%) and a hardcoded headline is the one place that would silently go
              stale. */}
          <h1 className="max-w-3xl text-balance text-[32px] font-semibold leading-[1.1] tracking-tight sm:text-[44px]">
            Solid rocket motor spending flat since FY{ml.first_fy}. One supplier holds{" "}
            {pct(cPsc.top1_share)} of it.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[16px] leading-relaxed text-[var(--muted)]">
            PSC 1337 is the only federal product code that names solid-fuel missile
            propulsion. It ran between {usd(ml.min)} and {usd(ml.max)} a year for a
            decade — {usd(ml.first)} in FY{ml.first_fy}, {usd(ml.last)} in FY
            {ml.last_fy} — peaking in FY{ml.peak_fy}, before the buildup.
          </p>
          <p className="mt-4 max-w-2xl text-pretty text-[16px] leading-relaxed text-[var(--muted)]">
            Over the same period, DoD obligations to guided-missile propulsion
            manufacturers rose {s.multiple}× to {usd(s.recent_avg)} a year, with{" "}
            {pct(c.top1_share)} going to one corporate group. But by product code that
            category is {pct(mix.propulsion_share)} propulsion: it buys complete missiles
            and launchers. The motor line is the part that never moved.
          </p>
          <div className="mt-8">
            <StatRow />
          </div>
        </div>
      </header>

      {/* ---------------- 1. the surge ---------------- */}
      <Section
        id="buildup"
        eyebrow="Signal 1 — the buildup, and a control"
        title={`Procurement rose ${s.multiple}×, and it is not a space-launch artifact`}
        lede={
          <>
            NAICS 336415 covers space launch as well as missiles, so the obvious
            objection is that this is NASA&apos;s Space Launch System showing up in a
            shared industry code. It is not. Filtered to NASA, the <em>same</em> code
            contracts {s.control_multiple}× over the same decade. Defense obligations
            rose twentyfold while civil space fell by a third.
          </>
        }
      >
        <Card className="p-4 pt-5">
          <SurgeChart />
        </Card>
        <div className="mt-4">
          <ProgramDependency />
        </div>
      </Section>

      {/* ---------------- 2. concentration ---------------- */}
      <Section
        id="concentration"
        eyebrow="Signal 2 — concentration"
        title={`${pct(c.top1_share)} of it sits with one corporate group`}
        lede={
          <>
            Share of DoD obligations in this category, {signals.windows.concentration},
            rolled up from {c.recipient_entities} registered recipient entities to{" "}
            {c.owner_groups} corporate owner groups. {c.owner_groups} groups received
            money here; all but the top three share {pct(c.tail_share)} of it. The HHI is{" "}
            {c.hhi.toLocaleString()} — but see the note below on what that does and does
            not mean.
          </>
        }
      >
        <Card className="p-4 pt-5">
          <ConcentrationChart />
        </Card>
        <Caveat label="What this number is, and what it is not" emphasis>
          This is concentration of <strong>award dollars received</strong>, not of
          manufacturing capacity. {leader.group} is the prime <em>integrator</em>{" "}
          — it wins the missile production contract and buys motors from suppliers one
          tier down. Read this as: the government&apos;s missile buying is routed almost
          entirely through one company. Do not read it as: one company builds{" "}
          {pct(c.top1_share)} of American rocket motors.
        </Caveat>
        <Caveat label="And the HHI is descriptive, not a market definition">
          HHI here is computed on shares of award dollars inside a procurement code. An
          antitrust HHI is computed on a defined relevant market — a specific product, in
          a specific geography, with substitutes analysed. This is not that, and no claim
          of market power, monopoly or antitrust violation is intended or supported. The{" "}
          {c.hhi_threshold} figure is cited because it is the most widely understood
          yardstick for &ldquo;how concentrated is concentrated&rdquo;. Read
          &ldquo;single-source&rdquo; and &ldquo;highly concentrated&rdquo; throughout
          this page as shorthand for measured properties of federal award data.
        </Caveat>
      </Section>

      {/* ---------------- 3. the correction ---------------- */}
      <Section
        id="category"
        eyebrow="Signal 3 — what the category actually contains"
        title="The propulsion code does not buy propulsion"
        lede={
          <>
            NAICS 336415 is named &ldquo;Guided Missile and Space Vehicle Propulsion Unit
            and Propulsion Unit Parts Manufacturing&rdquo;, which makes it tempting to
            call these dollars propulsion spending. An earlier version of this analysis
            did exactly that. The product codes — which describe the thing bought, where
            NAICS describes the awardee&apos;s industry — say otherwise.
          </>
        }
      >
        <PscMix />
        <Caveat label="Why this matters for anyone tracking the bottleneck">
          If you measure the solid rocket motor supply chain through the NAICS code
          named after it, you are measuring complete missiles and launcher hardware. It
          is the right lens for <em>who the government buys missiles from</em> and the
          wrong lens for <em>who makes the motors</em>. The geography shows the same
          thing independently: Maryland&apos;s {usd(geography.states[1].amount)} and New
          Jersey&apos;s {usd(geography.states[2].amount)} are MK 41 and MK 8 vertical
          launching system modules.
        </Caveat>
      </Section>

      {/* ---------------- 4. the actual motor line ---------------- */}
      <Section
        id="motor-line"
        eyebrow="Signal 4 — the motor line itself"
        title="The code that does name motors is flat, and nearly single-source"
        lede={
          <>
            PSC 1337 — &ldquo;Guided Missile and Space Vehicle Explosive Propulsion
            Units, Solid Fuel&rdquo; — is the most precise solid rocket motor identifier
            in the federal coding system. It is the green line on the chart above.
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <h3 className="mb-1.5 text-[14px] font-semibold">It never inflected</h3>
            <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
              Across the whole decade it moves by a factor of just {ml.flat_ratio}×,
              ranging between {usd(ml.min)} and {usd(ml.max)} a year, with no post-2022
              step at all — its peak year was FY{ml.peak_fy}, before the buildup began.
              An analyst tracking the motor bottleneck through the motor-specific code
              would conclude nothing had happened.
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="mb-1.5 text-[14px] font-semibold">
              And it is more concentrated, not less
            </h3>
            <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
              {pct(cPsc.top1_share)} of its {usd(cPsc.total)} goes to one group —{" "}
              {cPsc.groups[0].group}, via the 2023 acquisition of Aerojet Rocketdyne —
              at an HHI of {cPsc.hhi.toLocaleString()} across just {cPsc.owner_groups}{" "}
              groups. Where the data does name motors, it names essentially one
              supplier.
            </p>
          </Card>
        </div>
        {/* The ownership-rollup objection, answered from the data rather than
            caveated away: the rollup credits Aerojet's awards to L3Harris, which only
            acquired it in July 2023. */}
        <Card className="mt-3 p-4">
          <h3 className="mb-1.5 text-[14px] font-semibold">
            And it is not an artifact of the 2023 acquisition
          </h3>
          <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--muted)]">
            The rollup credits Aerojet Rocketdyne&apos;s awards to L3Harris, which
            acquired it on {acq.boundary}. So: does this only look single-source because
            a 2023 merger was applied backwards to 2020 awards? Split the window at the
            closing date and the answer is no — the same single entity leads both sides.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["pre", "post"] as const).map((k) => (
              <div
                key={k}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <div className="tnum text-[22px] font-semibold leading-none text-[var(--primary)]">
                  {pct(acq[k].top_share)}
                </div>
                <div className="mt-1.5 text-[12px] font-medium">
                  {k === "pre" ? "Before the acquisition" : "After the acquisition"}
                </div>
                <div className="text-[11.5px] leading-snug text-[var(--faint)]">
                  {acq[k].top_entity} — {usd(acq[k].top_amount)} of{" "}
                  {usd(acq[k].total)}
                  {k === "pre" && ", won as an independent company"}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted)]">
            The merger transferred an existing near-monopoly. It did not create one.
          </p>
        </Card>
        <Caveat label="The limit of this claim">
          Motors bought as part of a complete missile contract sit inside that contract
          and never appear as a separate line. So this is not evidence that motor{" "}
          <em>production</em> failed to grow. It is evidence that separately-procured
          motor buying did not grow, and that the public record gives no independent
          view of motor volume during a twentyfold missile buildup. For a bottleneck
          that is the more useful statement: the thing everyone says is the constraint
          is the thing the data cannot see.
        </Caveat>
      </Section>

      {/* ---------------- 5. geography ---------------- */}
      <Section
        id="geography"
        eyebrow="Signal 5 — geography"
        /* Deliberately led with Florida rather than the top-4 share: the top-4 figure
           is coincidentally also 92.2%, the same as PSC 1337's single-source share two
           sections above, and two unrelated 92.2% numbers on one page reads as an
           error. */
        title={`Florida alone takes ${pct(geography.states[0].share)} of it`}
        lede={
          <>
            Place of performance, {signals.windows.concentration}. Four states account
            for {pct(geography.top4_share)} of the total, across{" "}
            {geography.states.length} states with any activity at all.
          </>
        }
      >
        <Card className="p-4 pt-5">
          <GeoChart />
        </Card>
        <Caveat label="Prime awards track assembly, not motor production">
          Florida leads at {pct(geography.states[0].share)} — Lockheed&apos;s Orlando
          missile integration base. Meanwhile Utah, home of the largest solid rocket
          motor plant in the United States, receives {pct(ut?.share ?? 0)} (
          {usd(ut?.amount ?? 0)}), and the clearest unambiguous motor-production
          contract in the dataset — Stinger flight motors, built in Camden, Arkansas —
          accounts for {pct(ar?.share ?? 0)}. Prime awards track where missiles are{" "}
          <em>assembled</em>, not where motors are <em>cast</em>.
        </Caveat>
      </Section>

      {/* ---------------- 6. corroboration ---------------- */}
      <Section
        id="corroboration"
        eyebrow="Corroboration"
        title="The government already documents this"
        lede={
          <>
            None of the above depends on my reading of the data being right about the
            underlying industry. The concentration this analysis finds in contract
            records is already described by GAO, acted on by Congress, and funded
            against by the department itself.
          </>
        }
      >
        <Corroboration />
      </Section>

      {/* ---------------- 7. drill-down ---------------- */}
      <Section
        eyebrow="Drill-down"
        title={`The FY${s.peak_fy} inflection, contract by contract`}
        lede={
          <>
            The largest awards in this category recorded in FY{s.peak_fy}. Amounts are
            total contract value over the full period of performance — not FY
            {s.peak_fy} spending — which is why they are listed rather than added up.
            Note how many are launchers and complete missiles.
          </>
        }
      >
        <AwardTable which="fy23" limit={8} />
      </Section>

      {/* ---------------- limits: a disclosure, not a sixth finding ---------------- */}
      <Section
        id="limits"
        tone="limitation"
        eyebrow="Limits of the evidence"
        title="What this data cannot tell you"
        lede={
          <>
            This section is a disclosure, not a finding. The obvious question the charts
            above cannot answer is who actually manufactures the motors — prime award
            data does not say, and subaward data only gestures at it. Both panels below
            are shown as-is, including the unhelpful one, because the gap between them is
            the honest state of the public evidence.
          </>
        }
      >
        <SubawardPanel />
        <Caveat label="Why this panel is thin">
          Federal subaward reporting covers first-tier subcontracts above reporting
          thresholds. Solid rocket motor supply frequently sits deeper than tier one,
          and reporting compliance is uneven. This is the clearest limit of the whole
          project: public contract data shows you who the government pays, and only
          sometimes who they pay in turn.
        </Caveat>
      </Section>

      <Section tone="limitation" eyebrow="Disclosure" title="What I have not done">
        <div className="max-w-2xl space-y-3 text-[14px] leading-relaxed text-[var(--muted)]">
          <p>
            I have not sought comment from Lockheed Martin, L3Harris, Northrop Grumman or
            DoD public affairs, and nothing here should be read as reflecting their
            positions. Everything on this page is derived from public contract records
            and public government reporting.
          </p>
          <p>
            Any of those organisations may have a straightforward explanation for a figure
            here — particularly for how motor procurement is structured inside larger
            missile contracts, which is exactly what this data cannot see. If you are
            reporting on this, they are the right people to ask, and I would expect their
            answers to sharpen the picture rather than contradict it.
          </p>
        </div>
      </Section>

      {/* ---------------- method ---------------- */}
      <Section id="method" eyebrow="Method" title="How these numbers were produced">
        <Method />
      </Section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 text-[12.5px] text-[var(--faint)]">
          Built from the public USAspending.gov API. Every figure is recomputed by{" "}
          <code>scripts/build_signals.py</code> and read from a single{" "}
          <code>data/signals.json</code>, so the dashboard and the written analysis
          cannot disagree.
        </div>
      </footer>
    </main>
  );
}
