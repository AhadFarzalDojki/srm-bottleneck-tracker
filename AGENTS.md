<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules

## Single source of truth

`data/signals.json` is the only place a figure is ever calculated. Not the dashboard,
not the write-ups, not a sentence.

If you need to change a number, change the code that computes it in
`scripts/build_signals.py` and re-run `npm run data`. Never edit a figure in
`src/app/page.tsx` or in `analysis/*.md` directly — those read and quote, they do not
compute. Two checks enforce this from opposite directions:

- `verify_analysis.py` asserts every figure the prose quotes is present and current.
- `check_stale_figures.py` scans for any figure-shaped token in the prose that does NOT
  trace back to signals.json, a registered rounding, or a sourced external reference.

Both have caught real drift. Derived quantities (a ratio, a share of a remainder, a peak
year) belong in `build_signals.py` as fields, not as arithmetic in a component or a
sentence — that is how the same number ends up different in two places.

## The data pipeline is the product
`data/signals.json` is the single source of truth. The dashboard and the written
analysis both read from it and neither does its own arithmetic on raw API responses.
If a number appears on the site, it is computed in `scripts/build_signals.py` first.

Regenerate with `npm run data` (fetch → parent rollup → signals). The fetch step
caches to `data/raw/`, so reruns are cheap; pass `--force` to refresh.

## Three data rules that must not be broken
1. **Never sum `Award Amount` from the award-search endpoint as period dollars.** It
   is total contract value, and the date filter matches any transaction in window, so
   contracts signed years earlier appear at full value. Period dollars come only from
   `spending_over_time` / `spending_by_category` / `spending_by_geography`.
2. **Always roll recipients up to owner groups before computing a share.** USAspending
   returns child entities; Lockheed appears three times. Unrolled top-1 is 39.6%,
   rolled is 78.0%.
3. **Dedupe subawards by sub-award ID before summing.** Raw responses repeat rows
   across contract modifications.

`scripts/build_signals.py` asserts all three and refuses to write on failure.

## The framing constraint
The top-1 share is concentration of *propulsion-coded DoD award dollars* held by a
missile **integrator**, not evidence that one firm manufactures that share of rocket
motors. The actual motor producers sit one tier down and are largely invisible in
prime-award data. Never write copy that implies otherwise.
