#!/usr/bin/env python3
"""Compute every published figure from the cached raw pulls into data/signals.json.

signals.json is the single source of truth: the dashboard reads it, the written
analysis cites it, and nothing downstream is allowed to do its own arithmetic on raw
API responses. If a number appears on the site, it appears here first.

Three rules encoded here, each learned from a trap in the real data:

  1. Period dollars come only from transaction-based endpoints (spending_over_time,
     spending_by_category, spending_by_geography). The award-search "Award Amount"
     field is TOTAL CONTRACT VALUE and its date filter matches any transaction in
     window, so a 2014 Patriot contract shows up in an FY23 query at its full $457M.
     check_award_amount_trap() asserts we never conflate the two.

  2. Shares are computed on owner groups, never raw recipient rows. See
     build_parents.py. Unrolled vs rolled top-1 is 39.6% vs 78.0%.

  3. Subawards are deduped by sub-award ID before summing. The same DRS row repeats
     six times across contract modifications in the raw response.

Baseline framing: the headline growth multiple uses the FY2016-FY2019 average as the
base, not a single year. Single-year bases are a cherry-pick -- FY2017 was $16M, which
would produce a far larger and far less honest multiple.

Output: data/signals.json
Run:    python3 scripts/build_signals.py
"""
import json
import os
from collections import defaultdict
from datetime import date

from usaspending import LENS_LABELS, ROOT, load_raw, titlecase

OUT = os.path.join(ROOT, "data", "signals.json")
PARENTS = os.path.join(ROOT, "data", "parents.json")

LENSES = ("dod_336415", "nasa_336415", "psc1337")
BASE_FYS = (2016, 2017, 2018, 2019)     # pre-surge baseline
RECENT_FYS = (2023, 2024, 2025)         # post-inflection
HHI_HIGH = 2500                         # DOJ/FTC "highly concentrated" threshold

# Place-of-performance notes, each grounded in the award drill-down for that state
# rather than general knowledge. These are the states where the geography actively
# argues something: that these dollars follow integration sites and launcher work,
# while actual motor production barely registers.
STATE_NOTES = {
    "FL": "Orlando - Lockheed Martin; AGMS (JAGM/HELLFIRE) production, the single largest award in the data",
    "MD": "MK 41 vertical launching system modules - launcher hardware, not propulsion",
    "NJ": "MK 8 Standard Module - launcher hardware, not propulsion",
    "AZ": "Tucson - RTX missile production",
    "AR": "Camden - Aerojet Rocketdyne Stinger flight motors: the clearest actual "
          "solid-motor production contract anywhere in this data",
    "UT": "Home of the largest US solid rocket motor plant, yet ~1% of DoD "
          "propulsion-coded obligations - the motor work is reached by subcontract",
}


def series():
    """Per-fiscal-year obligations for each lens. Transaction-based (rule 1)."""
    by_fy = defaultdict(dict)
    for name in LENSES:
        for row in load_raw(f"over_time_{name}")["results"]:
            fy = int(row["time_period"]["fiscal_year"])
            by_fy[fy][name] = round(row["aggregated_amount"], 2)
    return [{"fy": fy, **by_fy[fy]} for fy in sorted(by_fy)]


def motor_line(rows):
    """Series properties of PSC 1337, the only code that names solid rocket motors.

    These were previously recomputed in the dashboard and written by hand in the prose.
    Both are forms of doing arithmetic outside the pipeline, which is how a figure ends
    up stale in one place and current in another. They live here now, so signals.json
    is the only thing that ever calculates them.
    """
    vals = {r["fy"]: r.get("psc1337", 0.0) for r in rows}
    nonzero = [v for v in vals.values() if v]
    peak_fy = max(vals, key=lambda f: vals[f])
    return {
        "min": round(min(nonzero), 2),
        "max": round(max(nonzero), 2),
        "first_fy": min(vals), "first": round(vals[min(vals)], 2),
        "last_fy": max(vals), "last": round(vals[max(vals)], 2),
        "peak_fy": peak_fy, "peak": round(vals[peak_fy], 2),
        "flat_ratio": round(max(nonzero) / min(nonzero), 1),
    }


def surge(rows):
    """Growth framing for the primary lens, using a multi-year baseline."""
    val = {r["fy"]: r.get("dod_336415", 0.0) for r in rows}
    base = sum(val.get(f, 0) for f in BASE_FYS) / len(BASE_FYS)
    recent = sum(val.get(f, 0) for f in RECENT_FYS) / len(RECENT_FYS)
    peak_fy = max(val, key=lambda f: val[f])
    latest_fy = max(val)
    nasa = {r["fy"]: r.get("nasa_336415", 0.0) for r in rows}
    nasa_base = sum(nasa.get(f, 0) for f in BASE_FYS) / len(BASE_FYS)
    nasa_recent = sum(nasa.get(f, 0) for f in RECENT_FYS) / len(RECENT_FYS)
    return {
        "baseline_fys": list(BASE_FYS), "baseline_avg": round(base, 2),
        "recent_fys": list(RECENT_FYS), "recent_avg": round(recent, 2),
        "multiple": round(recent / base, 1) if base else None,
        "peak_fy": peak_fy, "peak": round(val[peak_fy], 2),
        "latest_fy": latest_fy, "latest": round(val[latest_fy], 2),
        # The control: NASA uses the same NAICS code and moves the other way, which
        # is what rules out "this is just a space-launch accounting artifact".
        "control_baseline_avg": round(nasa_base, 2),
        "control_recent_avg": round(nasa_recent, 2),
        "control_multiple": round(nasa_recent / nasa_base, 2) if nasa_base else None,
    }


def concentration(src, parents):
    """Roll recipients to owner groups and compute shares + HHI (rules 2)."""
    rows = load_raw(src)["results"]

    # Some recipients net NEGATIVE over a window: a deobligation exceeding what was
    # obligated in the same period. A net-deobligating recipient is not a negative
    # competitor, it is a zero, so negatives are floored and the denominator is the sum
    # of positive obligations. Left unfloored, a single recipient's share can exceed
    # 100% (it does for PSC 1337 over the post-acquisition window) and HHI becomes
    # ill-defined, since squaring a negative share adds to concentration.
    negatives = [r for r in rows if (r["amount"] or 0) < 0]
    total = sum(r["amount"] for r in rows if (r["amount"] or 0) > 0)
    net_total = sum(r["amount"] or 0 for r in rows)

    agg = defaultdict(lambda: {"amount": 0.0, "entities": [], "note": None})
    for r in rows:
        if (r["amount"] or 0) <= 0:
            continue
        p = parents.get(r.get("recipient_id") or "", {})
        g = p.get("owner_group") or r["name"].title()
        agg[g]["amount"] += r["amount"]
        agg[g]["entities"].append(p.get("recipient_name") or r["name"])
        if p.get("ownership_note") and not agg[g]["note"]:
            agg[g]["note"] = p["ownership_note"]

    groups = sorted(
        ({"group": g, "amount": round(v["amount"], 2),
          "share": round(v["amount"] / total * 100, 2),
          "entities": len(v["entities"]),
          "entity_names": sorted(set(v["entities"]))[:6],
          "ownership_note": v["note"]}
         for g, v in agg.items()),
        key=lambda d: -d["amount"])

    shares = [g["share"] for g in groups]
    unrolled = sorted((r["amount"] for r in rows if (r["amount"] or 0) > 0), reverse=True)
    return {
        "total": round(total, 2),
        "net_total": round(net_total, 2),
        "negative_recipients": len(negatives),
        "deobligated": round(total - net_total, 2),
        "recipient_entities": len(rows),
        "owner_groups": len(groups),
        "top1_share": round(shares[0], 1),
        "top3_share": round(sum(shares[:3]), 1),
        # Everyone outside the top three, together. Quoted in the prose, so it is
        # computed here rather than as arithmetic in a sentence.
        "tail_share": round(100 - sum(shares[:3]), 1),
        "hhi": round(sum(s * s for s in shares)),
        "hhi_threshold": HHI_HIGH,
        # Kept deliberately: the gap between these two is the argument for doing the
        # parent rollup at all, and the dashboard shows it as a method note.
        "unrolled_top1_share": round(unrolled[0] / total * 100, 1),
        "groups": groups,
    }


def psc_mix():
    """Product-code composition of the primary lens, plus the propulsion share.

    This is the most important corrective in the project. NAICS 336415 is named for
    propulsion-unit manufacturing, and an earlier version of this analysis therefore
    described its dollars as "propulsion spending". The product codes say otherwise:
    the money buys complete guided missiles, launchers and complete missile systems.
    NAICS classifies the awardee's industry; PSC classifies the thing bought. When
    they disagree about what a contract is for, PSC is the one that answers it.
    """
    rows = [r for r in load_raw("psc_mix_dod")["results"] if r.get("amount")]
    total = sum(r["amount"] for r in rows)

    # Product codes that would be propulsion if anything here were. Over-inclusive on
    # purpose -- see fetch_usaspending.py -- so the share is stated at its largest.
    PROPULSION = {"1337", "2845", "1340", "1377"}

    groups = [{"code": r["code"], "name": (r.get("name") or "").title(),
               "amount": round(r["amount"], 2),
               "share": round(r["amount"] / total * 100, 2),
               "is_propulsion": r["code"] in PROPULSION}
              for r in sorted(rows, key=lambda r: -r["amount"])]

    prop_series = load_raw("propulsion_in_336415")["results"]
    prop_total = sum(r["aggregated_amount"] or 0 for r in prop_series)

    return {"total": round(total, 2),
            "codes": groups[:12],
            "propulsion_codes": sorted(PROPULSION),
            "propulsion_total": round(prop_total, 2),
            "propulsion_share": round(prop_total / total * 100, 2),
            "non_propulsion_share": round(100 - prop_total / total * 100, 2),
            "top3_share": round(sum(g["share"] for g in groups[:3]), 1)}


def program_dependency(rows):
    """How much of the whole category is one contract, and does the surge survive it?

    The single largest award in the lens is W31P4Q23C0005, "AGMS PRODUCTION" -- the
    Army's multi-year Air-to-Ground Missile Systems contract with Lockheed Martin for
    JAGM and HELLFIRE production, signed 30 March 2023. It is coded PSC 1410 (GUIDED
    MISSILES), which is the clearest single illustration of the NAICS/PSC mismatch this
    project had to correct for.

    It also turns out to be most of the surge. Any reporter will ask whether a
    twentyfold rise is really one program ramping, so the honest move is to compute
    the answer and publish both multiples.

    Obligations here are summed from the transaction endpoint -- federal_action_
    obligation per transaction, which IS period money -- not from the award search.
    The same award reads $2.21B in the award search; by transaction it is roughly
    $964M/$529M/$722M across FY2023/24/25.
    """
    txns = load_raw("top_award_txns")["results"]
    award = awards("awards_dod_fy23")[0]

    def fy_of(action_date):
        y, m = int(action_date[:4]), int(action_date[5:7])
        return y + 1 if m >= 10 else y

    by_fy = defaultdict(float)
    for t in txns:
        if t.get("action_date"):
            by_fy[fy_of(t["action_date"])] += t.get("federal_action_obligation") or 0.0

    lens_by_fy = {r["fy"]: r.get("dod_336415", 0.0) for r in rows}
    years = [{"fy": fy,
              "award": round(by_fy[fy], 2),
              "lens": round(lens_by_fy.get(fy, 0.0), 2),
              "share_of_fy": round(by_fy[fy] / lens_by_fy[fy] * 100, 1)
              if lens_by_fy.get(fy) else None}
             for fy in sorted(by_fy) if by_fy[fy]]

    award_total = sum(by_fy.values())
    window_total = sum(v for fy, v in lens_by_fy.items() if 2020 <= fy <= 2025)

    # Re-run the growth framing with this one contract removed.
    base = sum(lens_by_fy.get(f, 0) for f in BASE_FYS) / len(BASE_FYS)
    recent_ex = sum(lens_by_fy.get(f, 0) - by_fy.get(f, 0)
                    for f in RECENT_FYS) / len(RECENT_FYS)

    return {
        "award_id": award["award_id"],
        "recipient": award["recipient"],
        "recipient_id": award.get("recipient_id"),
        "description": award["description"],
        "program": "Air-to-Ground Missile Systems (AGMS) — JAGM and HELLFIRE production",
        "psc": award["psc"],
        "date_signed": award["start"],
        "total_contract_value": award["total_contract_value"],
        "obligated_to_date": round(award_total, 2),
        "years": years,
        "share_of_window": round(award_total / window_total * 100, 1),
        "peak_fy_share": next((y["share_of_fy"] for y in years
                               if y["fy"] == max(lens_by_fy, key=lambda f: lens_by_fy[f])),
                              None),
        "surge_multiple_ex_award": round(recent_ex / base, 1) if base else None,
        "recent_avg_ex_award": round(recent_ex, 2),
    }


def acquisition_timing(parents):
    """Was the motor-code concentration true before the Aerojet acquisition closed?

    The ownership rollup maps Aerojet Rocketdyne's awards to L3Harris, which acquired
    it on 28 July 2023. That is a defensible choice for "who controls this capability
    now", but it invites a fair objection: does the single-source finding only look
    that way because a 2023 merger was applied to 2020 awards retroactively?

    It does not. Splitting the window at the closing date shows Aerojet was already
    the dominant supplier as an independent company. The merger transferred an
    existing near-monopoly; it did not create one.
    """
    out = {}
    for label, src in (("pre", "recipients_psc1337_pre"),
                       ("post", "recipients_psc1337_post")):
        rows = [r for r in load_raw(src)["results"] if (r["amount"] or 0) > 0]
        total = sum(r["amount"] for r in rows)
        top = max(rows, key=lambda r: r["amount"])
        out[label] = {"total": round(total, 2),
                      "entities": len(rows),
                      "top_entity": titlecase(top["name"]),
                      "top_amount": round(top["amount"], 2),
                      "top_share": round(top["amount"] / total * 100, 1)}
    out["boundary"] = "2023-07-28"
    out["boundary_note"] = ("L3Harris completed its acquisition of Aerojet Rocketdyne "
                            "on 28 July 2023.")
    out["concentration_predates_acquisition"] = out["pre"]["top_share"] > 50
    return out


def concentration_ex_top_award(conc, prog, parents):
    """Re-run the concentration math with the single largest contract removed.

    The growth finding already carries this robustness check (20.2x vs 7.3x). The
    concentration finding needs the same one, because a reader who learns that one
    contract is half the window will immediately ask whether the 78% is also just that
    contract. It partly is -- and the answer survives anyway, which is worth showing.

    Only the award's in-window obligations are removed (all of them, as it happens:
    FY2023-FY2025, with nothing outside FY2020-FY2025). The award is attributed to an
    owner group by recipient_id rather than by name match, so this stays correct if
    the largest award ever changes hands or the largest contract changes.
    """
    removed = sum(y["award"] for y in prog["years"] if 2020 <= y["fy"] <= 2025)

    owner = (parents.get(prog.get("recipient_id") or "", {}) or {}).get("owner_group")
    if owner is None:
        # Fall back to the leading group: the largest award in a category this
        # concentrated belongs to the leader, but say so rather than assume silently.
        owner = conc["groups"][0]["group"]

    groups = []
    for g in conc["groups"]:
        amount = g["amount"] - (removed if g["group"] == owner else 0)
        if amount > 0:
            groups.append({"group": g["group"], "amount": round(amount, 2)})
    total = sum(g["amount"] for g in groups)
    for g in groups:
        g["share"] = round(g["amount"] / total * 100, 2)
    groups.sort(key=lambda g: -g["amount"])

    shares = [g["share"] for g in groups]
    return {
        "removed_award": prog["award_id"],
        "removed_amount": round(removed, 2),
        "attributed_to": owner,
        "total": round(total, 2),
        "top1_share": round(shares[0], 1),
        "top1_group": groups[0]["group"],
        "top3_share": round(sum(shares[:3]), 1),
        # Everyone outside the top three, together. Quoted in the prose, so it is
        # computed here rather than as arithmetic in a sentence.
        "tail_share": round(100 - sum(shares[:3]), 1),
        "hhi": round(sum(s * s for s in shares)),
        "still_highly_concentrated": sum(s * s for s in shares) > HHI_HIGH,
        "groups": groups[:8],
    }


def geography():
    rows = [r for r in load_raw("geo_dod")["results"] if r.get("aggregated_amount")]
    total = sum(r["aggregated_amount"] for r in rows)
    out = []
    for r in sorted(rows, key=lambda r: -r["aggregated_amount"]):
        out.append({"state": r["shape_code"], "name": r["display_name"],
                    "amount": round(r["aggregated_amount"], 2),
                    "share": round(r["aggregated_amount"] / total * 100, 2),
                    "note": STATE_NOTES.get(r["shape_code"])})
    return {"total": round(total, 2), "states": out,
            "top4_share": round(sum(s["share"] for s in out[:4]), 1)}


def subawards(src):
    """Dedupe by sub-award ID (rule 3), then aggregate by subawardee."""
    rows = load_raw(src)["results"]
    seen, uniq = set(), []
    for r in rows:
        key = r.get("Sub-Award ID")
        if key in seen:
            continue
        seen.add(key)
        uniq.append(r)

    agg = defaultdict(lambda: {"amount": 0.0, "primes": set(), "n": 0})
    for r in uniq:
        name = (r.get("Sub-Awardee Name") or "UNKNOWN").strip()
        agg[name]["amount"] += r.get("Sub-Award Amount") or 0.0
        agg[name]["primes"].add(titlecase((r.get("Prime Recipient Name") or "").strip()))
        agg[name]["n"] += 1

    top = sorted(({"subawardee": titlecase(k), "amount": round(v["amount"], 2),
                   "subawards": v["n"], "primes": sorted(p for p in v["primes"] if p)[:3]}
                  for k, v in agg.items()), key=lambda d: -d["amount"])[:12]
    return {"rows_returned": len(rows), "rows_after_dedupe": len(uniq),
            "duplicates_removed": len(rows) - len(uniq),
            "visible_total": round(sum(r.get("Sub-Award Amount") or 0.0 for r in uniq), 2),
            "complete": False, "top": top}


def awards(src):
    """Drill-down list. Amounts are TOTAL CONTRACT VALUE -- labeled, never summed."""
    out = []
    for r in load_raw(src)["results"]:
        out.append({"award_id": r.get("Award ID"),
                    "recipient": titlecase(r.get("Recipient Name") or ""),
                    "total_contract_value": r.get("Award Amount"),
                    "start": r.get("Start Date"), "end": r.get("End Date"),
                    "state": r.get("Place of Performance State Code"),
                    "naics": r.get("naics_code"), "psc": r.get("psc_code"),
                    "recipient_id": r.get("recipient_id"),
                    "description": (r.get("Description") or "")[:220]})
    return out


def check_award_amount_trap(rows):
    """Guardrail 1: award-search sums must NOT match transaction totals.

    If these ever converge, someone has started summing total contract values as if
    they were period obligations. Failing loudly here is the point.
    """
    fy23_transactions = next(r["dod_336415"] for r in rows if r["fy"] == 2023)
    fy23_award_sum = sum(a["total_contract_value"] or 0
                         for a in awards("awards_dod_fy23"))
    differs = abs(fy23_award_sum - fy23_transactions) > 1.0
    return {"name": "award_amount_is_not_period_obligation",
            "fy23_transaction_total": round(fy23_transactions, 2),
            "fy23_award_search_sum": round(fy23_award_sum, 2),
            "passed": differs,
            "detail": "Award-search totals include full value of contracts signed in "
                      "earlier years; they must never be used as period dollars."}


def main():
    with open(PARENTS) as fh:
        parents = json.load(fh)

    rows = series()
    conc = concentration("recipients_dod", parents)
    conc_psc = concentration("recipients_psc1337", parents)
    geo = geography()
    mix = psc_mix()
    prog = program_dependency(rows)
    conc_ex = concentration_ex_top_award(conc, prog, parents)
    acq = acquisition_timing(parents)
    subs = {k: subawards(f"subawards_{k}") for k in ("dod_336415", "psc1337")}

    # --- self-checks, persisted so the site can show that they ran ---
    series_window_total = sum(
        r.get("dod_336415", 0) for r in rows if 2020 <= r["fy"] <= 2025)
    checks = [
        check_award_amount_trap(rows),
        {"name": "recipient_rows_reconcile_to_series",
         "series_fy20_25_total": round(series_window_total, 2),
         "recipient_rows_total": conc["total"],
         "pct_diff": round(abs(series_window_total - conc["total"])
                           / series_window_total * 100, 3),
         "passed": abs(series_window_total - conc["total"]) / series_window_total < 0.02,
         "detail": "Top-100 recipients should account for ~all obligations in window; "
                   "a large gap means the long tail is being dropped from the denominator."},
        {"name": "parent_rollup_changed_the_answer",
         "unrolled_top1": conc["unrolled_top1_share"], "rolled_top1": conc["top1_share"],
         "passed": conc["top1_share"] > conc["unrolled_top1_share"] + 1,
         "detail": "Rolling child entities to owner groups must raise the leader's share; "
                   "if it does not, parent resolution silently failed."},
        {"name": "no_duplicate_owner_groups",
         "groups": conc["owner_groups"],
         "passed": len({g["group"] for g in conc["groups"]}) == len(conc["groups"]),
         "detail": "Each owner group appears exactly once in the concentration chart."},
        {"name": "primary_lens_is_not_propulsion",
         "propulsion_share_of_lens": mix["propulsion_share"],
         "top_code": f"{mix['codes'][0]['code']} {mix['codes'][0]['name']}",
         "passed": mix["propulsion_share"] < 5,
         "detail": "Guards the framing: propulsion product codes are a rounding error "
                   "inside NAICS 336415, so its dollars must never be described as "
                   "propulsion spending. If this share ever rises above 5%, the "
                   "wording on the site and in the analysis has to be revisited."},
        {"name": "single_award_obligations_fit_inside_the_year",
         "award_fy_peak": prog["years"][0]["award"] if prog["years"] else None,
         "share_of_peak_fy": prog["peak_fy_share"],
         "passed": all(y["share_of_fy"] is None or y["share_of_fy"] <= 100
                       for y in prog["years"]),
         "detail": "A single award's per-year obligations must never exceed the "
                   "category total for that year. If they do, award-level and "
                   "category-level figures are being mixed."},
        {"name": "concentration_survives_removing_the_largest_award",
         "top1_with": conc["top1_share"], "top1_without": conc_ex["top1_share"],
         "hhi_without": conc_ex["hhi"],
         "passed": conc_ex["hhi"] > HHI_HIGH,
         "detail": "The concentration finding must not rest on a single contract. If "
                   "removing the largest award drops HHI below the highly-concentrated "
                   "threshold, the headline claim needs rewriting, not just a footnote."},
        {"name": "motor_concentration_predates_the_acquisition",
         "pre_top_share": acq["pre"]["top_share"],
         "post_top_share": acq["post"]["top_share"],
         "passed": acq["concentration_predates_acquisition"],
         "detail": "Guards the ownership rollup against the charge that a 2023 merger "
                   "retroactively manufactured the single-source finding. If the "
                   "pre-acquisition leader ever falls below 50%, the claim has to be "
                   "restated as a post-merger effect."},
        {"name": "negative_obligations_are_floored_not_netted",
         "negative_recipients_primary": conc["negative_recipients"],
         "negative_recipients_motor_code": conc_psc["negative_recipients"],
         "passed": all(g["share"] <= 100 for g in conc["groups"] + conc_psc["groups"]),
         "detail": "Deobligations can push a recipient net-negative over a window. "
                   "Shares use the positive-obligation denominator so that no share "
                   "exceeds 100% and HHI stays well defined."},
        {"name": "subawards_deduped",
         "removed": subs["dod_336415"]["duplicates_removed"],
         "passed": subs["dod_336415"]["duplicates_removed"] >= 0
                   and subs["dod_336415"]["rows_after_dedupe"] > 0,
         "detail": "Raw subaward responses repeat rows across contract modifications."},
    ]

    payload = {
        "generated": date.today().isoformat(),
        "source": "USAspending.gov API v2 (public, no authentication)",
        "lens_labels": LENS_LABELS,
        "windows": {"series": "FY2016-FY2025", "concentration": "FY2020-FY2025"},
        "series": rows,
        "surge": surge(rows),
        "motor_line": motor_line(rows),
        "concentration": conc,
        "concentration_psc1337": conc_psc,
        "geography": geo,
        "psc_mix": mix,
        "program_dependency": prog,
        "concentration_ex_top_award": conc_ex,
        "acquisition_timing": acq,
        "subawards": subs,
        "awards": {"fy20_25": awards("awards_dod_fy20_25"),
                   "fy23": awards("awards_dod_fy23")},
        "checks": checks,
    }
    with open(OUT, "w") as fh:
        json.dump(payload, fh, indent=2)

    # --- human-readable gate ---
    s = payload["surge"]
    print(f"-> {OUT}\n")
    print("PRIMARY LENS: DoD, NAICS 336415, FY2020-FY2025")
    print(f"  total obligations   ${conc['total']/1e9:.2f}B "
          f"across {conc['recipient_entities']} entities -> {conc['owner_groups']} owner groups")
    print(f"  top-1 share         {conc['top1_share']}%  (unrolled would read "
          f"{conc['unrolled_top1_share']}%)")
    print(f"  top-3 share         {conc['top3_share']}%")
    print(f"  HHI                 {conc['hhi']}  (highly concentrated above {HHI_HIGH})")
    print(f"\nGROWTH  FY{BASE_FYS[0]}-{str(BASE_FYS[-1])[2:]} avg ${s['baseline_avg']/1e6:.0f}M"
          f"  ->  FY{RECENT_FYS[0]}-{str(RECENT_FYS[-1])[2:]} avg ${s['recent_avg']/1e6:.0f}M"
          f"   = {s['multiple']}x")
    print(f"  peak FY{s['peak_fy']} ${s['peak']/1e6:.0f}M | latest FY{s['latest_fy']} "
          f"${s['latest']/1e6:.0f}M")
    print(f"  NASA control same code: ${s['control_baseline_avg']/1e6:.0f}M -> "
          f"${s['control_recent_avg']/1e6:.0f}M = {s['control_multiple']}x")
    print("\nTOP OWNER GROUPS")
    for g in conc["groups"][:6]:
        note = f"  [{g['ownership_note']}]" if g["ownership_note"] else ""
        print(f"  {g['share']:5.1f}%  ${g['amount']/1e6:8.1f}M  {g['group']:20s}"
              f" ({g['entities']} entities){note}")
    print(f"\nWHAT THE PRIMARY LENS ACTUALLY BUYS (product codes)")
    for g in mix["codes"][:5]:
        flag = "  <- propulsion" if g["is_propulsion"] else ""
        print(f"  {g['share']:5.1f}%  ${g['amount']/1e6:8.1f}M  {g['code']} "
              f"{g['name'][:44]}{flag}")
    print(f"  propulsion product codes = {mix['propulsion_share']}% of the lens "
          f"(${mix['propulsion_total']/1e6:.1f}M) -- generously defined")
    print(f"\nMOTOR-CODE CONCENTRATION vs THE AEROJET ACQUISITION (closed "
          f"{acq['boundary']})")
    for k in ("pre", "post"):
        a = acq[k]
        print(f"  {k:4s}  {a['top_share']:5.1f}%  ${a['top_amount']/1e6:7.1f}M of "
              f"${a['total']/1e6:7.1f}M  {a['top_entity'][:40]}")
    print(f"  -> concentration predates the merger: "
          f"{acq['concentration_predates_acquisition']}")
    if conc_psc["negative_recipients"]:
        print(f"  note: motor code has {conc_psc['negative_recipients']} net-negative "
              f"recipients (${conc_psc['deobligated']/1e6:.1f}M deobligated); shares "
              f"use the positive-obligation denominator")
    print(f"\nPROGRAM DEPENDENCY  {prog['award_id']} ({prog['description']})")
    print(f"  {prog['program']}")
    print(f"  PSC {prog['psc']} | obligated ${prog['obligated_to_date']/1e6:.1f}M of "
          f"${prog['total_contract_value']/1e9:.2f}B award value")
    for y in prog["years"]:
        print(f"    FY{y['fy']}  ${y['award']/1e6:7.1f}M of ${y['lens']/1e6:7.1f}M "
              f"= {y['share_of_fy']}% of the category that year")
    print(f"  = {prog['share_of_window']}% of the entire FY20-25 window")
    print(f"  concentration EXCLUDING it: top-1 {conc_ex['top1_share']}% "
          f"(vs {conc['top1_share']}%), HHI {conc_ex['hhi']} (vs {conc['hhi']})")
    print(f"  surge multiple EXCLUDING this one contract: "
          f"{prog['surge_multiple_ex_award']}x (vs {surge(rows)['multiple']}x headline)")
    print(f"\nGEOGRAPHY  top-4 states = {geo['top4_share']}% of obligations")
    for st in geo["states"][:4]:
        print(f"  {st['share']:5.1f}%  ${st['amount']/1e6:8.1f}M  {st['state']} "
              f"{'- ' + st['note'] if st['note'] else ''}")
    print("\nCHECKS")
    for c in checks:
        print(f"  [{'PASS' if c['passed'] else 'FAIL'}]  {c['name']}")
    if not all(c["passed"] for c in checks):
        raise SystemExit("\nOne or more checks FAILED -- do not publish these numbers.")


if __name__ == "__main__":
    main()
