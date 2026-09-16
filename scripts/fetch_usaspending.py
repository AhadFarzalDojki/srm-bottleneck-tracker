#!/usr/bin/env python3
"""Pull every raw USAspending response this project needs into data/raw/.

Split from the signal math on purpose: the API is the slow, rate-limited,
occasionally-flaky part, so it runs once and everything downstream reads cached
JSON. That also means the published numbers can be re-derived and audited without
network access, which matters if a reporter asks how a figure was produced.

What gets pulled, and why each one exists:

  over_time_<lens>    FY2016-FY2025 obligations per fiscal year. Transaction-based,
                      so these are the only numbers safe to put in a time series.
  recipients_dod      Top 100 recipients FY20-25 under the primary lens. Feeds the
                      concentration math. Returns CHILD entities, not parents --
                      build_parents.py resolves that.
  geo_dod             State-level place-of-performance totals, primary lens.
  awards_dod_fy20_25  Award-level drill-down list. NOTE: "Award Amount" here is
  awards_dod_fy23     TOTAL CONTRACT VALUE, not in-window obligations, and the date
                      filter matches any transaction in the window -- so old
                      contracts appear at full value. Display only. Never summed.
  psc_mix_dod           Product-code composition of the primary lens. This is the
                        sensitivity check that showed NAICS 336415 is missile and
                        launcher procurement, not propulsion: it is what the
                        "propulsion-coded" framing had to be corrected against.
  propulsion_in_336415  Obligations inside the primary lens that carry ANY
                        propulsion-adjacent product code (1337/2845 plus the
                        deliberately generous 1340/1377). Used to state the share
                        honestly at its largest defensible value.
  top_award_txns        Every transaction on the single largest award in the primary
                        lens, so its obligations can be split by fiscal year. This is
                        also the cleanest demonstration of why award-search totals are
                        not period dollars: the award search reports this contract at
                        $2.21B, while its transactions show that spread across three
                        fiscal years.
  subawards_<lens>    Tier-2 visibility. Incomplete (FSRS underreporting) and
                      duplicated across modifications. Caveated in the UI.

Output: data/raw/*.json
Run:    python3 scripts/fetch_usaspending.py [--force]
"""
import sys

from usaspending import (CONC_END, CONC_START, SERIES_END, SERIES_START,
                         have_raw, lens, load_raw, post, save_raw)

AWARD_FIELDS = ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency",
                "Start Date", "End Date", "Place of Performance State Code",
                "Description", "naics_code", "psc_code", "recipient_id"]

SUBAWARD_FIELDS = ["Sub-Award ID", "Sub-Awardee Name", "Sub-Award Amount",
                   "Prime Recipient Name", "Sub-Award Date", "Award ID"]


def pulls():
    """Yield (name, endpoint, payload). One place to see every request made."""
    # --- Time series: the three lenses, full FY2016-FY2025 window ---
    for name in ("dod_336415", "nasa_336415", "psc1337"):
        yield (f"over_time_{name}", "search/spending_over_time/",
               {"group": "fiscal_year",
                "filters": lens(name, start=SERIES_START, end=SERIES_END)})

    # --- Concentration: recipients under the primary lens, FY20-25 ---
    yield ("recipients_dod", "search/spending_by_category/recipient/",
           {"category": "recipient",
            "filters": lens("dod_336415", start=CONC_START, end=CONC_END),
            "limit": 100})

    # Same for PSC 1337, so the secondary panel can show its own recipient mix.
    yield ("recipients_psc1337", "search/spending_by_category/recipient/",
           {"category": "recipient",
            "filters": lens("psc1337", start=CONC_START, end=CONC_END),
            "limit": 100})

    # --- Was the motor-code concentration true BEFORE the Aerojet acquisition? ---
    # L3Harris completed its acquisition of Aerojet Rocketdyne on 28 July 2023. Because
    # the ownership rollup maps Aerojet's awards to L3Harris (current ownership), a
    # sharp reader will ask whether the single-source finding is an artifact of that
    # merger being applied retroactively. Splitting the window at the closing date
    # answers it from the data instead of with a caveat.
    for name, start, end in (
            ("recipients_psc1337_pre", CONC_START, "2023-07-27"),
            ("recipients_psc1337_post", "2023-07-28", CONC_END)):
        yield (name, "search/spending_by_category/recipient/",
               {"category": "recipient",
                "filters": lens("psc1337", start=start, end=end), "limit": 100})

    # --- Product-code composition of the primary lens (the sensitivity check) ---
    yield ("psc_mix_dod", "search/spending_by_category/psc/",
           {"category": "psc",
            "filters": lens("dod_336415", start=CONC_START, end=CONC_END),
            "limit": 25})

    # How much of the primary lens is propulsion at all? The PSC list here is
    # deliberately over-inclusive (1340 is rocket ammunition, 1377 is propellant
    # actuated devices such as ejection-seat cartridges) so that the resulting share
    # is the most generous figure the data supports, not the most damning one.
    f = lens("dod_336415", start=CONC_START, end=CONC_END)
    f["psc_codes"] = ["1337", "2845", "1340", "1377"]
    yield ("propulsion_in_336415", "search/spending_over_time/",
           {"group": "fiscal_year", "filters": f})

    # --- Geography: where the work is performed ---
    yield ("geo_dod", "search/spending_by_geography/",
           {"scope": "place_of_performance", "geo_layer": "state",
            "filters": lens("dod_336415", start=CONC_START, end=CONC_END)})

    # --- Award drill-downs (display only, see module docstring) ---
    yield ("awards_dod_fy20_25", "search/spending_by_award/",
           {"filters": lens("dod_336415", start=CONC_START, end=CONC_END),
            "fields": AWARD_FIELDS, "page": 1, "limit": 25,
            "sort": "Award Amount", "order": "desc", "subawards": False})

    # FY23 alone: this is the inflection year, so the composition matters.
    yield ("awards_dod_fy23", "search/spending_by_award/",
           {"filters": lens("dod_336415", start="2022-10-01", end="2023-09-30"),
            "fields": AWARD_FIELDS, "page": 1, "limit": 15,
            "sort": "Award Amount", "order": "desc", "subawards": False})

    # --- Transaction history of the single biggest award (program dependency) ---
    # The award id is not hardcoded: it is read back from the FY-peak award pull, so
    # this keeps pointing at whatever the largest award actually is.
    if have_raw("awards_dod_fy23"):
        top = load_raw("awards_dod_fy23")["results"]
        if top:
            yield ("top_award_txns", "transactions/",
                   {"award_id": top[0]["generated_internal_id"],
                    "page": 1, "limit": 500, "sort": "action_date", "order": "asc"})

    # --- Tier-2 subawards, both lenses ---
    for name in ("dod_336415", "psc1337"):
        yield (f"subawards_{name}", "search/spending_by_award/",
               {"filters": lens(name, start=CONC_START, end=CONC_END),
                "fields": SUBAWARD_FIELDS, "page": 1, "limit": 100,
                "sort": "Sub-Award Amount", "order": "desc", "subawards": True})


def main():
    force = "--force" in sys.argv
    fetched = skipped = 0
    for name, endpoint, payload in pulls():
        if have_raw(name) and not force:
            print(f"  cached  {name}")
            skipped += 1
            continue
        data = post(endpoint, payload)
        save_raw(name, data)
        n = len(data.get("results", []))
        print(f"  fetched {name}  ({n} rows)")
        fetched += 1
    print(f"\n{fetched} fetched, {skipped} cached -> data/raw/")
    if skipped and not force:
        print("Re-run with --force to refresh cached responses.")


if __name__ == "__main__":
    main()
