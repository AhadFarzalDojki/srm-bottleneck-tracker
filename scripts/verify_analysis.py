#!/usr/bin/env python3
"""Assert every figure quoted in the written analysis still matches signals.json.

The written piece is the artifact that actually gets sent to people, and it is the
one place where a number can go stale silently: regenerate the data six months from
now and the prose keeps asserting last year's figures. This script builds each
expected string from signals.json and requires it to appear verbatim in the markdown.

It is deliberately strict about the claims that carry the argument -- the growth
multiple, the concentration shares, the HHI values, the control direction, and the
figures used to separate integrator from producer. A failure here means either the
data moved (update the prose) or the prose drifted (fix the prose).

Run:  python3 scripts/verify_analysis.py
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Both write-ups quote the same figures, so both are checked. A number that appears in
# only one of them is the failure mode this guards against: the short version is what
# gets pasted into a pitch, and it going stale is worse than the long one doing so.
DOCS = {
    "srm-concentration.md": os.path.join(ROOT, "analysis", "srm-concentration.md"),
    "outreach-short.md": os.path.join(ROOT, "analysis", "outreach-short.md"),
    "outreach-emails.md": os.path.join(ROOT, "analysis", "outreach-emails.md"),
}

# Documents that quote only a handful of figures are checked against just those, rather
# than against every claim with a long exemption list. The emails are the text most
# likely to be sent without re-reading, so the figures they do quote must be current.
SUBSET = {
    "outreach-emails.md": {
        "propulsion share of lens", "PSC1337 top-1 share", "PSC1337 flat ratio",
        "PSC1337 peak year", "growth multiple", "ex-contract multiple",
        "program share of window", "ex-award top-1 share", "ex-award HHI",
        "pre-acquisition top share", "post-acquisition top share",
        "acquisition closing date", "program award id", "Utah share",
    },
}
SIG = os.path.join(ROOT, "data", "signals.json")


LIVE_SUBSET = {
    # Figures that must be identical between the write-ups and the deployed dashboard.
    # A reader who checks a number in the piece against the site and finds a mismatch
    # discards both, so this is checked against the served HTML rather than the build.
    "top-1 share", "top-3 share", "HHI", "unrolled share",
    "propulsion share of lens", "PSC 1410 share", "PSC 1440 share", "PSC 1425 share",
    "PSC1337 top-1 share", "PSC1337 HHI", "PSC1337 group count", "PSC1337 total",
    "growth multiple", "ex-contract multiple", "program share of window",
    "ex-award top-1 share", "ex-award HHI", "program award id",
    "pre-acquisition top share", "post-acquisition top share",
    "Florida share", "Utah share", "Arkansas share",
}


def fetch_live(url):
    """The deployed page as plain text.

    React writes <!-- --> markers between interpolated values, so "FY" and "2016" are
    separate text nodes. Strip comments before tags or every interpolated figure looks
    like it is missing.
    """
    req = urllib.request.Request(url, headers={"User-Agent": "srm-verify/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read().decode("utf-8", "replace")
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    html = re.sub(r"<script.*?</script>", " ", html, flags=re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", html)


def main():
    d = json.load(open(SIG))
    # Collapse whitespace: the prose is hard-wrapped, so "$57\nmillion" must still
    # match the claim "$57 million". Matching the raw file would fail on line breaks
    # that have nothing to do with whether the figure is right.
    texts = {name: re.sub(r"\s+", " ", open(path).read())
             for name, path in DOCS.items()}

    # --live <url> adds the deployed dashboard as another document to check.
    live_url = None
    if "--live" in sys.argv:
        live_url = sys.argv[sys.argv.index("--live") + 1]
        texts["LIVE dashboard"] = fetch_live(live_url)
        SUBSET["LIVE dashboard"] = LIVE_SUBSET

    s, c, p, g = d["surge"], d["concentration"], d["concentration_psc1337"], d["geography"]
    mix = d["psc_mix"]
    st = {x["state"]: x for x in g["states"]}
    psc = [r["psc1337"] for r in d["series"]]
    peak_fy = max(d["series"], key=lambda r: r["psc1337"] or 0)["fy"]
    sub = d["subawards"]["psc1337"]["top"][0]
    top_award = d["awards"]["fy23"][0]

    # (label, string that must appear verbatim in the prose — or a list of accepted
    # spellings). Only claims the prose actually makes: a claim listed here that the
    # prose has stopped making would pass on a coincidental number match and quietly
    # stop protecting anything.
    claims = [
        # --- the surge ---
        ("growth multiple", f"{s['multiple']}×"),
        ("baseline average", [f"${s['baseline_avg']/1e6:.0f} million",
                              f"${s['baseline_avg']/1e6:.0f}M"]),
        ("recent average", [f"${s['recent_avg']/1e9:.2f} billion",
                            f"${s['recent_avg']/1e9:.2f}B"]),
        ("peak", f"${s['peak']/1e9:.2f} billion in FY{s['peak_fy']}"),
        ("NASA control multiple", f"{s['control_multiple']}×"),
        ("NASA recent average", f"${s['control_recent_avg']/1e6:.0f} million"),
        # --- concentration ---
        ("top-1 share", f"{c['top1_share']}%"),
        ("top-3 share", f"{c['top3_share']}%"),
        ("leader name", c["groups"][0]["group"]),
        ("HHI", f"{c['hhi']:,}"),
        ("owner group count", [str(c["owner_groups"]), "Ninety-four"]),
        ("unrolled share", f"{c['unrolled_top1_share']}%"),
        # --- the correction: what the category actually buys ---
        ("PSC 1410 share", f"{mix['codes'][0]['share']:.1f}%"),
        ("PSC 1440 share", f"{mix['codes'][1]['share']:.1f}%"),
        ("PSC 1425 share", f"{mix['codes'][2]['share']:.1f}%"),
        ("propulsion share of lens", f"{mix['propulsion_share']}%"),
        ("propulsion total", f"${mix['propulsion_total']/1e6:.1f} million"),
        ("lens total", f"${mix['total']/1e9:.2f} billion"),
        # --- the motor line ---
        ("PSC1337 range low", f"${min(psc)/1e6:.0f} million"),
        ("PSC1337 range high", f"${max(psc)/1e6:.0f} million"),
        ("PSC1337 flat ratio", f"{max(psc)/min(psc):.1f}×"),
        ("PSC1337 peak year", f"FY{peak_fy}"),
        ("PSC1337 first year", f"${psc[0]/1e6:.0f} million"),
        ("PSC1337 last year", f"${psc[-1]/1e6:.0f} million"),
        ("PSC1337 top-1 share", f"{p['top1_share']}%"),
        # The dashboard renders compact dollars and the prose renders words; both
        # spellings of the same value are accepted rather than forcing one style.
        ("PSC1337 total", [f"${p['total']/1e6:.0f} million", f"${p['total']/1e6:.0f}M"]),
        ("pre-acquisition top share",
         f"{d['acquisition_timing']['pre']['top_share']}%"),
        ("post-acquisition top share",
         f"{d['acquisition_timing']['post']['top_share']}%"),
        ("acquisition closing date", "28 July 2023"),
        ("PSC1337 HHI", f"{p['hhi']:,}"),
        ("PSC1337 group count", str(p["owner_groups"])),
        # --- geography (only the states the prose names) ---
        ("Florida share", f"{st['FL']['share']:.1f}%"),
        ("Florida amount", f"${st['FL']['amount']/1e9:.2f} billion"),
        ("Maryland amount", f"${st['MD']['amount']/1e6:.0f} million"),
        ("New Jersey amount", f"${st['NJ']['amount']/1e6:.0f} million"),
        ("Utah share", f"{st['UT']['share']:.1f}%"),
        ("Utah amount", f"${st['UT']['amount']/1e6:.1f} million"),
        ("Arkansas share", f"{st['AR']['share']:.1f}%"),
        # --- program dependency (the robustness check on the headline) ---
        ("program award id", str(d["program_dependency"]["award_id"])),
        ("program share of window", f"{d['program_dependency']['share_of_window']}%"),
        ("ex-contract multiple", f"{d['program_dependency']['surge_multiple_ex_award']}×"),
        ("program FY23 obligation",
         f"${d['program_dependency']['years'][0]['award']/1e6:.0f} million"),
        ("ex-award top-1 share", f"{d['concentration_ex_top_award']['top1_share']}%"),
        ("ex-award HHI", f"{d['concentration_ex_top_award']['hhi']:,}"),
        # --- tier 2 and drill-down ---
        ("subaward figure", f"${sub['amount']/1e6:.1f} million"),
        ("top FY23 award id", str(top_award["award_id"])),
        # NOTE: the award's $2.21B total value is still quoted in the prose, but now
        # explicitly as an award-search artifact contrasted against its per-year
        # transactions -- never as an FY2023 figure.
        ("award total value (as a contrast, not a period figure)",
         f"${top_award['total_contract_value']/1e9:.2f} billion"),
    ]

    # Numbers the prose must NOT contain: figures that look authoritative but are the
    # traps this project exists to avoid quoting.
    forbidden = [
        ("unrolled leader share presented as the headline",
         rf"\b{c['unrolled_top1_share']}%\s+of (?:those|these|all)\b"),
        # An earlier version of this checker tried to detect the misleading framing
        # with a regex over the prose. It fired on the legitimate sentence "this is not
        # propulsion spending" -- policing meaning with a pattern produces false
        # positives faster than it catches real ones. The protection now lives in
        # required_phrases below, which is checkable without guessing at intent.
    ]

    def found(needle, text):
        """A claim passes if any of its accepted spellings appears."""
        options = [needle] if isinstance(needle, str) else needle
        return any(o in text for o in options)

    def show(needle):
        return needle if isinstance(needle, str) else " | ".join(needle)

    # Sentences the prose must carry, because they are the load-bearing corrections.
    # If someone rewrites the piece and drops these, the figures above could all still
    # match while the framing silently reverts to the version that was wrong.
    required_phrases = [
        ("NAICS-vs-PSC distinction is stated", "NAICS classifies"),
        ("the correction is disclosed", "earlier draft"),
        ("integrator-not-manufacturer caveat", "not manufacturing share"),
        ("narrow-basket justification", "ejection-seat"),
        ("headline multiple is qualified by the single contract", "7.3"),
        ("the dominant program is named", "Air-to-Ground Missile Systems"),
        ("ownership rollup timing is addressed", "86.3"),
    ]

    # Claims that belong to one document only, with the reason.
    exempt = {
        "outreach-short.md": {
            "NASA control multiple",        # control series is a method point, long form
            "NASA recent average",
            "owner group count",
            "unrolled share",               # rollup method belongs in the long version
            "lens total",
            "propulsion total",
            "PSC1337 flat ratio",
            "subaward figure",              # tier-2 nuance needs the long treatment
            "award total value (as a contrast, not a period figure)",
            "program FY23 obligation",
            "Maryland amount",
            "New Jersey amount",
            "Utah amount",
            "PSC1337 peak year",
            "top FY23 award id",
        },
    }
    phrase_exempt = {
        "outreach-short.md": {
            "the correction is disclosed",   # no room for project history in a pitch
            "NAICS-vs-PSC distinction is stated",
            "narrow-basket justification",
        },
    }

    failures = []
    for doc, text in texts.items():
        subset = SUBSET.get(doc)
        for label, phrase in required_phrases:
            if subset is not None or label in phrase_exempt.get(doc, set()):
                continue
            if phrase.lower() not in text.lower():
                failures.append(f"MISSING  [{doc}] {label}: must contain {phrase!r}")
        for label, needle in claims:
            if subset is not None:
                if label not in subset:
                    continue
            elif label in exempt.get(doc, set()):
                continue
            if not found(needle, text):
                failures.append(
                    f"MISSING  [{doc}] {label}: expected {show(needle)!r}")

    for label, pattern in forbidden:
        if re.search(pattern, text):
            failures.append(f"FORBIDDEN {label}: matched {pattern!r}")

    width = max(len(l) for l, _ in claims)
    for label, needle in claims:
        marks = "".join(
            "." if (SUBSET.get(doc) is not None and label not in SUBSET[doc])
            or (SUBSET.get(doc) is None and label in exempt.get(doc, set()))
            else ("o" if found(needle, text) else "X")
            for doc, text in texts.items())
        print(f"  [{marks}] {label:{width}s}  {show(needle)}")
    print("\n  columns: " + " | ".join(texts) + "   (o found, X missing, . n/a)")

    if live_url:
        print(f"\n  LIVE dashboard checked: {live_url}")

    if failures:
        print("\n" + "\n".join(failures))
        raise SystemExit(f"\n{len(failures)} claim(s) in the analysis do not match "
                         "signals.json -- update the prose or the data.")
    print(f"\nAll quoted figures across {len(texts)} documents match "
          f"data/signals.json ({len(claims)} figures, {len(required_phrases)} "
          "required framing phrases).")


if __name__ == "__main__":
    main()
