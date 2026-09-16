# The Solid Rocket Motor Bottleneck

A dashboard and written analysis built on public U.S. federal contract data, showing
how concentrated American missile propulsion procurement became during the post-2022
buildup.

**Headline finding.** DoD obligations to guided-missile propulsion manufacturers (NAICS
336415) grew **20.2×**, from a FY2016–FY2019 average of $57M/yr to a FY2023–FY2025
average of $1.16B/yr, and **78.0%** of it went to a single corporate group (HHI
**6,188**, against 2,500 as the DOJ/FTC "highly concentrated" line).

But by product code that category is **0.32% propulsion** — it buys complete guided
missiles (53.4%), launchers (31.9%) and complete missile systems (10.5%). The one code
that does name solid rocket motors, PSC 1337, stayed **flat** across the decade
($145M in FY2016, $138M in FY2025) and is **92.2% single-source**.

And half the surge is one contract: **W31P4Q23C0005**, the Army's Air-to-Ground Missile
Systems (AGMS) award to Lockheed for JAGM/HELLFIRE production, is **51.1%** of the
window and ~two-thirds of every post-inflection year. Excluding it, growth is **7.3×**
rather than 20.2×. Both numbers are published.

So: missile procurement surged (substantially via one program) and consolidated, the
separately-procured motor line never moved, and the public record offers no independent
view of motor volume at all.

**Read it:** [full analysis](analysis/srm-concentration.md) (~1,000 words, with method
and caveats) · [short version + email framing](analysis/outreach-short.md) (~450 words,
for pitches) · [outreach emails](analysis/outreach-emails.md) (two drafts + answers to
the questions a reporter will actually ask)

## Running it

```bash
npm install
npm run data         # fetch → parent rollup → signals → verify the written analysis
npm run dev          # dashboard at http://localhost:3000
```

`npm run data` is safe to re-run: API responses are cached under `data/raw/`. Pass
`--force` to `fetch_usaspending.py` to refresh them.

## How it fits together

```
scripts/usaspending.py        shared API client + the three named filter "lenses"
scripts/fetch_usaspending.py  every API call, cached to data/raw/
scripts/build_parents.py      recipient entities → corporate owner groups
scripts/build_signals.py      all published figures → data/signals.json
scripts/verify_analysis.py    asserts the prose still matches the data
src/app/page.tsx              the dashboard
analysis/srm-concentration.md the full written piece
analysis/outreach-short.md    short version + email framing
analysis/outreach-emails.md   first-contact emails + objection handling
```

`data/signals.json` is the single source of truth. The dashboard and the analysis both
read from it, and neither does its own arithmetic on raw API responses — so every
figure is traceable to one named filter, and the two cannot disagree.

## The lenses

| Lens | Filter | Role |
|---|---|---|
| `dod_336415` | NAICS 336415 + awarding agency DoD | **Primary** for the surge and the concentration finding. *Not* a propulsion lens — NAICS classifies the awardee's industry, and by product code this is 96% complete missiles, launchers and missile systems. |
| `nasa_336415` | NAICS 336415 + NASA | **Control.** Declines 0.63× over the same period, ruling out a space-launch explanation. |
| `psc1337` | PSC 1337 (solid-fuel motors) | **The only true motor lens**, because PSC describes the product bought. Flat at 1.5× across the decade and 92.2% single-source. |

## Four rules the pipeline enforces

The build refuses to write new figures unless all of these hold:

1. **Period dollars never come from the award-search endpoint.** It returns *total
   contract value*, and its date filter matches any transaction in window — a 2014
   contract appears in an FY2023 query at full value. Dollars come from the
   transaction-based endpoints only.
2. **Recipients roll up to owner groups before any share is computed.** USAspending
   returns separate child registrations per division; unrolled, the leader reads 55.0%
   instead of 78.0%.
3. **Subawards are deduplicated by sub-award ID.** Raw responses repeat rows across
   contract modifications.
4. **Product code beats industry code when they disagree** about what a contract is
   for. This rule produced a correction mid-project: the category was initially
   described as "propulsion spending" on the strength of the NAICS code's name. The
   build now fails if propulsion codes exceed 5% of the primary lens without the
   wording being revisited.
5. **Quoted figures and load-bearing caveats in the prose must match `signals.json`.**
   `verify_analysis.py` checks 44 figures plus six required framing phrases, across
   **all three** write-ups — so neither the short version nor the outreach emails can
   go stale. Documents that quote only a few figures are checked against just those.

## The framing constraint

The 78% figure is concentration of **award dollars received** by a missile
*integrator* — not evidence that one firm manufactures 78% of American rocket motors.
Nor does the flat PSC 1337 line prove motor *production* stalled: motors bought inside a
complete missile contract never appear as a separate line.
The actual motor producers sit one tier down and are largely invisible in prime-award
data. Utah, home of the largest US solid rocket motor plant, receives 1.2% of these
obligations; the clearest motor-production contract in the data is $53.6M for Stinger
flight motors in Camden, Arkansas. Prime awards track where missiles are *assembled*,
not where motors are *cast*.

Deferred to a later version: an award-to-delivery lead-time proxy (needs per-award
modification history to be honest — option years and IDV mods stretch end dates),
SAM.gov open solicitations, and EU TED data.

## Source

USAspending.gov API v2. Public, no authentication, no API key. Contract award types
A–D only, so unexercised indefinite-delivery ceilings are not counted as spending.
