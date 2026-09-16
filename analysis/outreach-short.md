# Short version — for pitches and posts

*~450 words. The full analysis, with method and caveats, is in
[`srm-concentration.md`](srm-concentration.md). Every figure in both is asserted against
`data/signals.json` by `scripts/verify_analysis.py`.*

---

## The motor line never moved

US missile procurement surged after 2022. The rocket motor line did not.

Department of Defense obligations to guided-missile propulsion manufacturers (NAICS
336415) rose from a FY2016–FY2019 average of **$57 million a year** to **$1.16 billion**
in FY2023–FY2025 — **20.2×**, peaking at $1.47 billion in FY2023. **78.0%** of it went to
Lockheed Martin and **91.7%** to the top three groups, at an HHI of **6,188** against the
2,500 that DOJ and FTC guidelines call highly concentrated — a descriptive yardstick
here, not a market definition.

Two things immediately qualify that, and both are in the data.

**Half of the surge is one contract.** W31P4Q23C0005 — the Army's Air-to-Ground Missile
Systems award to Lockheed for JAGM and HELLFIRE production, signed March 2023 — is
**51.1%** of the whole FY2020–FY2025 window and roughly two-thirds of every year after
the inflection. Strip it out and growth is **7.3×**, top-1 share **54.9%**, HHI
**3,462**. Both findings survive; neither is as large as the headline.

**And almost none of this is propulsion.** NAICS 336415 is named "Guided Missile and
Space Vehicle Propulsion Unit and Propulsion Unit Parts Manufacturing." By product code,
which describes what was actually bought, the category is **53.4% complete guided
missiles, 31.9% launchers, 10.5% complete missile systems** — and **0.32% propulsion**.
NAICS classifies the manufacturer's industry; PSC classifies the purchase. Anyone
tracking the solid rocket motor supply chain through the industry code named after it is
measuring missiles and launcher hardware.

So where is the motor line? PSC 1337 — "Guided Missile and Space Vehicle Explosive
Propulsion Units, Solid Fuel" — is the most precise motor identifier in the federal
system. Across the decade it moves by a factor of **1.5×**, between $111 million and
$171 million a year, peaking in **FY2020, before the buildup**. FY2016: $145 million.
FY2025: $138 million. And **90.5%** of its $807 million goes to one group — L3Harris,
via its 2023 acquisition of Aerojet Rocketdyne — at an HHI of **8,242** across 16 groups.

That rollup uses *current* ownership, so the obvious question is whether a 2023 merger
retroactively created the finding. It didn't: splitting at the 28 July 2023 closing date,
the same single entity held **86.3%** of the motor code beforehand as an independent
company, and 98.2% after.

The geography says it independently. Florida takes **58.8%** ($2.41 billion), Lockheed's
Orlando integration base. Utah, home of the largest solid rocket motor plant in the
country, gets **1.2%**. The clearest unambiguous motor contract in the dataset is $53.6
million of Stinger flight motors in Camden, Arkansas — **1.3%**.

**This lines up with what the government already says.** GAO's review of the solid
rocket motor industrial base ([GAO-18-45](https://www.gao.gov/products/gao-18-45)) found
the industry consolidated from six US manufacturers to two since 1995, and records DoD's
position that current demand can only sustain two. Congress has since sought an SRM
industrial base strategy ([S.5556](https://www.congress.gov/bill/118th-congress/senate-bill/5556/text)),
and DPA Title III money went to expanding motor capacity in September 2025. The contract
data agrees with all of it — and adds that only *one* of those two manufacturers is
visible in the procurement line that names motors. Northrop, the other, sits at 2.6%.

**The limits, stated plainly.** The 78% is award dollars received by a prime integrator,
not manufacturing share. And the flat PSC 1337 line does not prove motor *production*
stalled — motors bought inside a complete missile contract never appear as a separate
line. That is the actual finding: during a twentyfold buildup in missile buying,
separately-procured motor spending stayed flat for a decade and consolidated into
effectively one supplier, and the public record offers no independent view of motor
volume at all. The bottleneck everyone names is the part the data cannot see.

HHI here is descriptive: it is computed on shares of award dollars inside a procurement
code, not on a defined relevant market, and implies no antitrust claim. I have not sought
comment from Lockheed Martin, L3Harris, Northrop Grumman or DoD public affairs; a company
may well have a straightforward explanation for how motor buying sits inside larger
missile contracts, which is precisely what this data cannot see.

All from the public USAspending.gov API — no authentication, fully reproducible.

---

## Email framing

Leads with the finding, not the tool. Replace the bracketed parts.

> **Subject:** 0.3% of the "propulsion" contracts are propulsion
>
> Hi [name] —
>
> I've been pulling USAspending data on missile propulsion procurement and found
> something that might be useful for your [beat//recent piece on munitions capacity]:
> the NAICS code named for rocket propulsion manufacturing is 0.3% propulsion by product
> code — it's 53% complete missiles and 32% launchers. The one code that does name solid
> rocket motors (PSC 1337) has been flat for a decade, peaked in FY2020 before the
> buildup, and 90.5% of it goes to a single supplier.
>
> I built a small dashboard for it: https://srm-bottleneck-tracker.vercel.app. Happy to share the underlying data or walk
> through the method — it's all public API, no auth, and the pipeline is open.
>
> [name]

**Notes on using it.** Trade press first — Breaking Defense, Defense News, War on the
Rocks — since the feedback loop is fastest and the bar is lowest. Don't lead with the
20.2× figure: it's the number most likely to draw a "well, that's one contract"
response, and you want to be the one who raises that, not them. The 0.3% finding is the
genuinely novel one and it's hard to argue with.
