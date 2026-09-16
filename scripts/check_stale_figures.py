#!/usr/bin/env python3
"""Scan the write-ups for any figure that does NOT come from signals.json.

verify_analysis.py checks the opposite direction: that each claim we expect is present.
That cannot catch a stale number left behind by an edit -- a 92.2% still sitting in a
sentence after the underlying value moved to 90.5%. This script walks every
figure-shaped token in every document and flags anything that is neither derivable from
data/signals.json nor on the explicit external-sources allowlist.

The allowlist is the important part: a lot of legitimate numbers in these documents come
from outside the dataset (GAO's consolidation figures, the DOJ/FTC threshold, contract
values from press releases). Each entry carries its source, so the list cannot quietly
become a place to silence real drift.

Run:  python3 scripts/check_stale_figures.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIG = os.path.join(ROOT, "data", "signals.json")
DOCS = ["srm-concentration.md", "outreach-short.md", "outreach-emails.md"]

# Numbers that legitimately appear but are not ours. Keep the source with each one.
EXTERNAL = {
    "2,500": "DOJ/FTC highly-concentrated HHI threshold",
    "2500": "DOJ/FTC highly-concentrated HHI threshold",
    "5,000": "GAO-18-45 (Oct 2017): a manufacturer's estimate of its sub-tier supplier base before decline",
    "1,000": "GAO-18-45 (Oct 2017): the same manufacturer's estimate after decline",
    "1995": "GAO-18-45 (Oct 2017): consolidation start year",
    "118-159": "Public Law number, FY2025 NDAA",
    "866": "NDAA section number",
    "$33.5 million": "DPA Title III awards total, war.gov release 26 Sept 2025",
    "$12.6 million": "DPA Title III award to Americarb, war.gov release 26 Sept 2025",
    "$20.9 million": "DPA Title III award to GD-OTS, war.gov release 26 Sept 2025",
    "$4.5 billion": "press-reported AGMS contract ceiling",
    "$439.5 million": "press-reported AGMS initial award",
    "$483 million": "press-reported AGMS follow-on",
    "$720 million": "press-reported AGMS follow-on",
    "$457 million": "the 2014 Patriot contract used as the award-search trap example",
    "$14.6 million": "deobligated total, reported to one decimal from deobligated field",
    "1,500": "word count of the proposed contributed piece",
    "336415": "NAICS code",
    "1337": "PSC code",
    "1410": "PSC code",
    "1440": "PSC code",
    "1425": "PSC code",
    "1340": "PSC code",
    "1377": "PSC code",
    "2845": "PSC code",
    "5556": "Senate bill number",
    "118th": "Congress number",
    "18-45": "GAO report number",
}

# Roundings used deliberately in short-form prose, each tied to the field it rounds.
# Registered rather than blanket-allowed: if the underlying value moves, the rounding
# stops validating and this check fails, which is the whole point. A bare "92%" that
# happened to round from an unrelated figure is what slipped through before.
ROUNDED = {
    "53%": "psc_mix.codes.0.share",
    "32%": "psc_mix.codes.1.share",
    "10%": "psc_mix.codes.2.share",
}


def resolve(doc, path):
    """Walk a dotted path, treating all-digit segments as list indices."""
    cur = doc
    for seg in path.split("."):
        cur = cur[int(seg)] if seg.isdigit() else cur[seg]
    return cur


PATTERNS = [
    re.compile(r"\d{1,3}(?:\.\d{1,2})?%"),                     # 78.0%, 0.32%
    re.compile(r"\d{1,3}(?:\.\d{1,2})?×"),                     # 20.2x
    re.compile(r"\b\d{1,3},\d{3}\b"),                          # 6,188
    re.compile(r"\$\d[\d,]*(?:\.\d+)?\s?(?:million|billion)"),  # $1.16 billion
]


def numbers_from(obj, out):
    """Every numeric leaf in signals.json."""
    if isinstance(obj, dict):
        for v in obj.values():
            numbers_from(v, out)
    elif isinstance(obj, list):
        for v in obj:
            numbers_from(v, out)
    elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
        out.append(float(obj))


def acceptable(values):
    """Every spelling of every figure we might legitimately write."""
    ok = set()
    for v in values:
        av = abs(v)
        # Percentages are admitted only at the precision they are stored at, plus one
        # extra decimal. Generating a 0-decimal variant for every value made "92%"
        # acceptable because an unrelated 92.2% existed -- which is exactly how a stale
        # "~92% single-source" survived a pass of this check. Write shares precisely.
        ok.add(f"{v:.1f}%")
        ok.add(f"{v:.2f}%")
        if float(v * 10).is_integer() is False:
            ok.add(f"{v:.2f}%")
        if float(v).is_integer():
            ok.add(f"{int(v)}%")
        for d in (0, 1, 2):
            ok.add(f"{v:.{d}f}×")
        if float(v).is_integer():
            ok.add(f"{int(v):,}")
            ok.add(str(int(v)))
        if av >= 1e9:
            for d in (0, 1, 2):
                ok.add(f"${v/1e9:.{d}f} billion")
        if av >= 1e6:
            for d in (0, 1, 2):
                ok.add(f"${v/1e6:.{d}f} million")
                ok.add(f"${v/1e9:.{d}f} billion")
        if av >= 1e3:
            for d in (0, 1):
                ok.add(f"${v/1e6:.{d}f} million")
    return ok


def main():
    doc = json.load(open(SIG))
    values = []
    numbers_from(doc, values)

    rounded_ok = {}
    for token, path in ROUNDED.items():
        actual = resolve(doc, path)
        if round(actual) == int(token.rstrip("%")):
            rounded_ok[token] = actual
        else:
            print(f"  registered rounding {token} no longer matches {path} "
                  f"(now {actual}) -- prose needs updating")
    # Percentages and multiples are derived, so admit ratios between window figures too.
    ok = acceptable(values)

    problems = []
    for name in DOCS:
        path = os.path.join(ROOT, "analysis", name)
        text = re.sub(r"\s+", " ", open(path).read())
        # Ignore URLs: they carry report numbers and years that are not our figures.
        text = re.sub(r"https?://\S+", " ", text)
        found = set()
        for pat in PATTERNS:
            found |= set(pat.findall(text))
        for tok in sorted(found):
            norm = tok.replace("  ", " ")
            if norm in ok or norm in EXTERNAL or norm in rounded_ok:
                continue
            # "$1.16 billion" style with a different space/precision
            if any(norm.replace(" ", "") == o.replace(" ", "") for o in ok):
                continue
            problems.append((name, tok))

    if problems:
        print("Figures not traceable to signals.json or the external allowlist:\n")
        for name, tok in problems:
            print(f"  {name:26s} {tok}")
        raise SystemExit(
            f"\n{len(problems)} untraceable figure(s). Either they are stale (fix the "
            "prose), or they are legitimately external (add them to EXTERNAL with a "
            "source).")
    print(f"Every figure in {len(DOCS)} documents traces to data/signals.json, a "
          f"registered rounding, or a sourced external reference.")
    if rounded_ok:
        print("  registered roundings verified against live values: "
              + ", ".join(f"{t}={v}" for t, v in rounded_ok.items()))


if __name__ == "__main__":
    main()
