#!/usr/bin/env python3
"""Shared USAspending.gov API client and the filter "lenses" this project is built on.

Why a shared module: every headline number in this project has to be traceable to one
of a small number of named, reviewable filter definitions. Scattering inline filter
dicts across scripts is how a project like this quietly starts comparing FY23 DoD
numbers against FY23 DoD+NASA numbers and publishes the difference as a finding.

The lenses (validated against the live API before this project was scaffolded):

  dod_336415   NAICS 336415 + awarding agency DoD. PRIMARY for the procurement
               surge and the concentration finding -- but NOT a propulsion lens.
               Despite the code's name ("Guided Missile and Space Vehicle Propulsion
               Unit ... Manufacturing"), its product-code composition is 53% complete
               GUIDED MISSILES, 32% LAUNCHERS and 10% COMPLETE MISSILE SYSTEMS.
               Propulsion product codes are 0.3% of it. NAICS classifies the awardee's
               industry, not the thing being bought, so this lens measures missile and
               launcher procurement from propulsion-classified manufacturers.
  nasa_336415  Same NAICS, NASA instead. CONTROL. Declines over the same period,
               which is what lets us say the surge is defense-driven, not space.
  psc1337      PSC 1337 (solid-fuel missile propulsion units). SECONDARY, and a
               finding by absence: it is flat, so the propulsion buildup is not
               being coded to the SRM-specific product code.

No API key and no auth required. Responses are cached to data/raw/ so that reruns
and the signal build do not re-hit the API.
"""
import json
import os
import time
import urllib.error
import urllib.request

API = "https://api.usaspending.gov/api/v2"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")

# Contract award types only: A/B/C/D are definitive contracts and purchase orders.
# Excludes IDV ceilings, which would count capacity we cannot show was ever bought.
AWARD_TYPES = ["A", "B", "C", "D"]

DOD = {"type": "awarding", "tier": "toptier", "name": "Department of Defense"}
NASA = {"type": "awarding", "tier": "toptier",
        "name": "National Aeronautics and Space Administration"}

# Full series window, and the narrower window used for concentration math.
SERIES_START, SERIES_END = "2015-10-01", "2025-09-30"   # FY2016-FY2025
CONC_START, CONC_END = "2019-10-01", "2025-09-30"       # FY2020-FY2025


def filters(*, naics=None, psc=None, agency=None, start, end):
    """Build a USAspending filter object. Keyword-only to prevent positional mixups."""
    f = {"award_type_codes": AWARD_TYPES,
         "time_period": [{"start_date": start, "end_date": end}]}
    if naics:
        f["naics_codes"] = naics
    if psc:
        f["psc_codes"] = psc
    if agency:
        f["agencies"] = [agency]
    return f


def lens(name, *, start, end):
    """Return the filter object for a named lens over the given window."""
    if name == "dod_336415":
        return filters(naics=["336415"], agency=DOD, start=start, end=end)
    if name == "nasa_336415":
        return filters(naics=["336415"], agency=NASA, start=start, end=end)
    if name == "psc1337":
        return filters(psc=["1337"], start=start, end=end)
    raise ValueError(f"unknown lens: {name}")


LENS_LABELS = {
    "dod_336415": "DoD - NAICS 336415 (propulsion mfg)",
    "nasa_336415": "NASA - NAICS 336415 (control)",
    "psc1337": "PSC 1337 (solid-fuel motors)",
}


def post(path, payload, *, tries=4):
    """POST JSON to the API with backoff. Raises on persistent failure."""
    url = f"{API}/{path.lstrip('/')}"
    body = json.dumps(payload).encode()
    last = None
    for attempt in range(tries):
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json",
                     "User-Agent": "srm-bottleneck-tracker/1.0 (public data research)"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read())
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            last = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"POST {path} failed after {tries} tries: {last}")


def get(path, *, tries=2, timeout=15, required=True):
    """GET JSON from the API with backoff.

    Returns None for a 404 (unknown recipient) and, when required=False, for any
    persistent failure. The recipient detail endpoint is usually fast (~0.3s) but
    occasionally hangs on a single entity; a long timeout there stalls a whole batch,
    so callers that can degrade gracefully should pass required=False.
    """
    url = f"{API}/{path.lstrip('/')}"
    last = None
    for attempt in range(tries):
        req = urllib.request.Request(
            url, headers={"User-Agent": "srm-bottleneck-tracker/1.0 (public data research)"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            last = e
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
        if attempt + 1 < tries:
            time.sleep(1.5 * (attempt + 1))
    if required:
        raise RuntimeError(f"GET {path} failed after {tries} tries: {last}")
    return None


def cache_path(name):
    return os.path.join(RAW, f"{name}.json")


def save_raw(name, obj):
    os.makedirs(RAW, exist_ok=True)
    with open(cache_path(name), "w") as fh:
        json.dump(obj, fh, indent=2)


def load_raw(name):
    with open(cache_path(name)) as fh:
        return json.load(fh)


def have_raw(name):
    return os.path.exists(cache_path(name))


# Genuine acronyms and legal-form suffixes that must not be title-cased into
# "Inc"/"Llc"/"Se". Shared so recipient names and subawardee names are formatted
# the same way wherever they appear.
ACRONYMS = {"USA", "US", "UK", "L3", "RTX", "SGL", "DRS", "BAE", "SE", "AS", "AG",
            "NV", "SA", "PLC", "LLC", "LP", "OTS", "II", "III", "IV"}


def titlecase(name):
    """Turn the API's SHOUTING CASE into something printable, keeping acronyms.

    Hyphenated tokens are handled piecewise so "GENERAL DYNAMICS-OTS" keeps its
    acronym instead of becoming "General Dynamics-Ots".
    """
    if not name:
        return name

    def one(tok):
        bare = tok.strip(",.()[]'\"")
        if bare.upper() in ACRONYMS and bare.isupper():
            return tok
        return tok.title()

    out = []
    for w in name.replace(",", " ,").split():
        out.append("-".join(one(part) for part in w.split("-")) if "-" in w else one(w))
    return " ".join(out).replace(" ,", ",")
