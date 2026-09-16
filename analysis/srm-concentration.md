# US missile procurement grew twentyfold. The rocket motor line never moved.

*What public U.S. federal contract data shows about the solid rocket motor bottleneck.
All figures from the USAspending.gov API — public, no authentication — and reproducible
from the pipeline in this repository.*

---

Between FY2016 and FY2019, the Department of Defense obligated an average of **$57
million a year** to manufacturers classified under NAICS 336415, the industry code for
guided missile and space vehicle propulsion manufacturing. Between FY2023 and FY2025 it
obligated an average of **$1.16 billion** — a **20.2× increase**, peaking at **$1.47
billion in FY2023**, the first full budget cycle after the invasion of Ukraine.

Across FY2020–FY2025, **78.0%** of that money — $3.37 billion of $4.33 billion — went
to a single corporate group, Lockheed Martin. The top three hold **91.7%**. The
Herfindahl–Hirschman Index is **6,188**, nearly two and a half times the 2,500 at which
DOJ and FTC merger guidelines call a market highly concentrated — cited here as a
descriptive yardstick, not as a market definition or an antitrust claim (see Method). Ninety-four corporate
groups received money in this category; ninety-one of them share 8.3% of it.

And the surge is genuinely defense-driven. NAICS 336415 covers space launch too, so the
obvious objection is that this is NASA's Space Launch System in a shared industry code.
Filtered to NASA, the *same* code moves the other way: **0.63×** over the same decade,
down to **$221 million** a year. Defense obligations rose twentyfold while civil space
propulsion fell by a third.

## Half of the surge is one contract

Before that twentyfold figure travels any further, it needs the qualification I would
want if someone handed it to me. The single largest award in the category is
**W31P4Q23C0005**, the Army's multi-year **Air-to-Ground Missile Systems (AGMS)**
contract with Lockheed Martin — JAGM and HELLFIRE production, signed 30 March 2023 and
run out of Orlando. Its product code is **PSC 1410, "Guided Missiles."**

By transaction, it obligated **$963 million in FY2023**, $529 million in FY2024 and $722
million in FY2025 — roughly **two-thirds of the entire category in each of those years**,
and **51.1%** of the FY2020–FY2025 window.

So the fair question is whether either headline finding is really just this contract.
Strip it out and both survive:

| | All contracts | Excluding AGMS |
|---|---|---|
| Growth multiple | 20.2× | **7.3×** |
| Top-1 share | 78.0% | **54.9%** |
| HHI | 6,188 | **3,462** |

7.3× is still a steep rise, and an HHI of 3,462 is still well above the 2,500 threshold
for a highly concentrated market. But "US missile procurement grew twentyfold" is
substantially the story of one air-to-ground missile program scaling up, and both columns
belong in any honest account.

That contract also demonstrates the headline methodological trap. The award-search
endpoint reports it as a single $2.21 billion figure. Its transactions show that spread
across three fiscal years. Same contract; only the second view is period money.

## But this is not propulsion spending

Here is where the intuitive reading breaks, and it is worth being blunt about it: an
earlier draft of this analysis called these dollars "propulsion spending," on the
strength of the industry code's name. Checking the product codes showed that is not
what the money buys.

NAICS classifies the *awardee's industry*. PSC — the federal product service code —
classifies *the thing purchased*. Broken out by PSC, the category is:

| Share | Product code | |
|---|---|---|
| **53.4%** | PSC 1410 | Guided missiles |
| **31.9%** | PSC 1440 | Launchers, guided missile |
| **10.5%** | PSC 1425 | Guided missile systems, complete |
| **0.32%** | PSC 1337/2845/1340/1377 | Anything propulsion-related |

**Propulsion product codes account for 0.32% of the category — $13.9 million out of
$4.33 billion.** That figure is deliberately generous: it counts rocket ammunition (PSC
1340) and propellant-actuated devices such as ejection-seat cartridges (PSC 1377)
alongside the two codes that genuinely describe missile propulsion.

The geography says the same thing independently. Florida leads at **58.8%** ($2.41
billion) — Lockheed's Orlando missile integration base. Maryland's **$556 million** and
New Jersey's **$453 million** are MK 41 and MK 8 vertical launching system modules:
launcher hardware. Meanwhile Utah, home of the largest solid rocket motor plant in the
United States, receives **1.2%** ($49.9 million), and the clearest unambiguous
motor-production contract in the dataset — Stinger flight motors, built in Camden,
Arkansas — accounts for **1.3%**.

If you measure the solid rocket motor supply chain through the NAICS code named after
it, you are measuring complete missiles and launcher hardware.

## The code that does name motors is flat, and nearly single-source

PSC 1337 — "Guided Missile and Space Vehicle Explosive Propulsion Units, Solid Fuel" —
is the most precise solid rocket motor identifier in the federal system.

It never inflected. Across the decade it moves by a factor of just **1.5×**, ranging
between **$111 million** and **$171 million** a year. Its peak year was **FY2020**,
before the buildup. FY2016: $145 million. FY2025: $138 million.

Where it is used, it is *more* concentrated than the missile category, not less:
**90.5%** of its **$807 million** goes to one group — L3Harris, via its 2023 acquisition
of Aerojet Rocketdyne — at an HHI of **8,242** across just **16** groups.

That ownership rollup deserves a direct answer rather than a footnote, because it maps
Aerojet's awards to a company that only bought it on **28 July 2023**. Does the
single-source finding only look that way because a 2023 merger was applied backwards to
2020 awards? No. Split the window at the closing date and the same single entity —
Aerojet Rocketdyne Coleman Aerospace — holds **86.3%** of the motor code *before* the
acquisition, as an independent company, and **98.2%** after. The merger transferred an
existing near-monopoly; it did not manufacture one.

I draw that basket narrowly on purpose. Folding in PSC 1340 and 1377 would roughly
quadruple the apparent motor market and collapse the concentration finding into noise —
but 1340 is unguided and artillery rocket ammunition, and 1377's largest recipient is an
ejection-seat manufacturer. Neither is missile propulsion.

## Independent corroboration

None of the above depends on my reading of the data being right about the underlying
industry. But the corroboration needs to be characterised precisely, because it splits
into an old baseline and current action, and only the second is recent.

**The baseline, and it is nearly a decade old.** GAO's review of the solid rocket motor
industrial base ([GAO-18-45](https://www.gao.gov/products/gao-18-45)) is dated **October
2017** — the report number is fiscal-year based, so it is easily mistaken for a 2018
document, and it predates the post-2022 buildup by five years. It reports that since 1995
the industry consolidated from six US manufacturers to two, which it names as **Aerojet
Rocketdyne and Orbital ATK** — Northrop Grumman acquired Orbital ATK in June 2018, after
publication. Separately, *a manufacturer estimated to GAO* that its sub-tier supplier base
fell from roughly 5,000 firms to about 1,000 over twenty years; that is an industry
estimate reported by GAO, not a GAO count. And a senior DoD industrial-base-policy
official told GAO that current DoD needs require two SRM manufacturers, but that there is
not enough demand to keep three companies economically viable.

Treat that report as establishing the starting structure. It is not recent confirmation of
anything, and my fresh data being consistent with it is not the same as the government
having said so lately.

**Current action, which is recent.** [Section 866 of the FY2025 NDAA](https://www.congress.gov/118/plaws/publ159/PLAW-118publ159.pdf)
— Public Law 118-159, enacted 23 December 2024 — requires the Under Secretary of Defense
for Acquisition and Sustainment to submit a strategy for ensuring the industrial base can
meet requirements for programs of record relating to solid rocket motors, and directs the
Secretary of Defense to seek a federally funded research centre review of that base,
covering existing manufacturers' capacity to expand, the capability of potential new
entrants, and the process for qualifying them. That is enacted law, not a proposal.

Then on **26 September 2025** the department announced two Defense Production Act Title III
awards [totalling $33.5 million](https://www.war.gov/News/Releases/Release/Article/4316035/department-of-war-awards-335-million-to-increase-solid-rocket-motor-capacity-an/):
$12.6 million to Americarb for carbonized rayon phenolic, the ablative material that
insulates rocket nozzles, and $20.9 million to General Dynamics Ordnance and Tactical
Systems to add nozzle capacity and become a new supplier of composite nozzles and
insulators. The department is paying to widen a supplier base it considers too narrow.

A companion bill, [S.5556](https://www.congress.gov/bill/118th-congress/senate-bill/5556),
would have required a similar strategy. Sen. John Cornyn introduced it on 17 December 2024;
it was referred to the Senate Armed Services Committee, attracted no cosponsors, and died
there when the 118th Congress ended. **It never became law**, and is mentioned only as an
additional signal of attention.

**One apparent discrepancy is worth confronting directly, because it cuts in favour of the
argument rather than against it.** GAO describes a *two*-manufacturer base. The motor code
shows one supplier at 90.5% — and Northrop Grumman, which now owns the Orbital ATK
business GAO named as the second manufacturer, at **2.6%**. Utah, where Northrop's largest
motor plant sits, receives 1.2% of the obligations in the primary lens.

That is not a contradiction of GAO. It is the same point this analysis keeps arriving at
from different directions: Northrop's motor production largely flows into Northrop's own
missile programs and into subcontracts, neither of which appears as separately-coded motor
procurement. A duopoly exists in the industrial base; only one member of it is visible in
the public procurement line that names motors. If you were using this data alone to map
the motor supply base, you would miss half of it.

## What I have not done

I have not sought comment from Lockheed Martin, L3Harris, Northrop Grumman, or DoD
public affairs, and nothing here should be read as reflecting their positions. Everything
above is derived from public contract records and public government reporting. A company
may have a straightforward explanation for any figure here — particularly for how motor
procurement is structured inside larger missile contracts, which is exactly the thing
this data cannot see. If you are reporting on this, they are the right people to ask, and
I would expect their answers to sharpen the picture rather than contradict it.

## What this does and does not prove

The 78% figure is concentration of **award dollars received** by a prime *integrator*,
not manufacturing share. Lockheed wins the missile production contract and buys motors
from suppliers one tier down. Nothing here shows that one company builds 78% of American
rocket motors.

Nor does the flat PSC 1337 line prove that motor *production* failed to grow. Motors
bought as part of a complete missile contract sit inside that contract and never appear
as a separate line. Subaward reporting offers only a glimpse: under PSC 1337 it shows
Aerojet Rocketdyne receiving **$66.3 million** beneath a Lockheed Martin prime — exactly
the supplier relationship prime data cannot see — but first-tier thresholds and uneven
compliance mean absence from that layer proves nothing.

## The defensible conclusion

Three things are true in the public record simultaneously:

1. **Missile and launcher procurement surged** — 20.2× headline, **7.3×** once the
   single AGMS contract is excluded — and narrowed to one integrator at 78.0%, HHI
   6,188. That one contract is 51.1% of the window; without it the leader still holds
   54.9% at an HHI of 3,462.
2. **Almost none of it is propulsion** — 0.32% by product code — so the industry code
   named for propulsion cannot be used to track motors.
3. **The one line that does name motors never moved**, and 90.5% of it goes to a
   single supplier.

For a supply chain everyone agrees is the constraint, that is the finding: during a
twentyfold buildup in missile buying, separately-procured solid rocket motor spending
stayed flat for a decade and consolidated into effectively one supplier — and the public
record offers no independent view of motor volume at all. The bottleneck everyone names
is the part the data cannot see.

---

### Method

Public USAspending.gov API v2, no authentication. Contract award types A–D only, so
unexercised indefinite-delivery ceilings are not counted as spending. Four rules the
build enforces, each learned from a trap in the real data:

**Period dollars never come from the award-search endpoint.** It returns *total contract
value*, and its date filter matches any transaction in window — a 2014 Patriot contract
appears in an FY2023 query at its full $457 million. All charted dollars come from the
transaction-based endpoints; award tables are labelled as total contract value and never
summed.

**Recipients are rolled up to owner groups before any share is computed.** USAspending
returns separate child registrations per division; Lockheed appears as seven. Unrolled,
the leader reads **55.0%** rather than 78.0%. Acquisition mapping (Orbital ATK→Northrop
2018, Aerojet Rocketdyne→L3Harris 2023) reflects *current* ownership.

**Product code beats industry code when they disagree** about what a contract is for.
This is the rule that produced the correction above; the build now fails if propulsion
codes ever exceed 5% of the primary lens without the wording being revisited.

**Subaward rows are deduplicated by sub-award ID.** Raw responses repeat rows across
contract modifications.

**HHI here is descriptive, not a market definition.** The Herfindahl–Hirschman Index is
computed on shares of *award dollars inside a procurement code*. An antitrust HHI is
computed on shares of a defined relevant market — a specific product, in a specific
geography, with substitutes analysed. This is not that, and no claim of market power,
monopoly, or antitrust violation is intended or supported. The DOJ/FTC 2,500 threshold is
cited because it is the most widely understood yardstick for "how concentrated is
concentrated," not because these figures establish anything under the merger guidelines.
Read every use of "single-source" and "highly concentrated" in this piece as shorthand for
a measured property of federal award data.

**Shares use the positive-obligation denominator.** Three recipients net *negative* over
the motor-code window — a deobligation larger than what was obligated in the same period.
A net-deobligating recipient is a zero, not a negative competitor, so negatives are
floored rather than netted. Left unfloored, a single recipient's share exceeds 100% over
the post-acquisition window and HHI stops being well defined, since squaring a negative
share adds to apparent concentration. This affects only the motor code ($14.6M
deobligated); the primary lens has no negative recipients.

Every figure quoted here is asserted against `data/signals.json` by
`scripts/verify_analysis.py`, so the prose cannot drift from the data.
