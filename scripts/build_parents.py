#!/usr/bin/env python3
"""Resolve award recipients to their corporate parent, then to a current owner group.

This is the single most consequential transform in the project. USAspending's
recipient category returns CHILD entities -- separate registrations per division and
location -- so "LOCKHEED MARTIN CORPORATION" comes back three times with three UEIs.
Computing a market share on those raw rows understates the leader badly: unrolled, the
top recipient reads 39.6%; correctly rolled up, it is 78.0%. A concentration dashboard
that gets this wrong is worse than no dashboard.

Two hops are needed:

  1. API hop. GET /api/v2/recipient/{recipient_id}/ returns parent_name / parent_uei.
     This handles divisions (ATK LAUNCH SYSTEMS LLC -> NORTHROP GRUMMAN INNOVATION
     SYSTEMS LLC) but stops at the registered parent, which is itself often a
     subsidiary shell left over from an acquisition.

  2. Ownership hop. A small curated map, below, collapses those registered parents
     into the group that owns the capability today. This cannot be derived from the
     API -- USAspending reflects registration, not M&A -- so it is hand-maintained
     and each entry carries its reason.

Caveat worth stating wherever these rollups are published: the ownership hop is
CURRENT ownership. Aerojet Rocketdyne's FY20-FY23 awards were won as an independent
company and are rolled into L3Harris here because L3Harris acquired it in July 2023.
That is the right lens for "who controls this capability now" and the wrong lens for
"who won work then". The emitted records keep both names so either can be shown.

Output: data/parents.json
Run:    python3 scripts/build_parents.py [--force]
"""
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

from usaspending import ROOT, get, have_raw, load_raw, save_raw, titlecase

OUT = os.path.join(ROOT, "data", "parents.json")
LOOKUP = "recipients_lookup"   # cached per-recipient API responses

# Ownership hop. Matched as an uppercase substring against the registered parent
# name first, then the recipient name. Order matters: first match wins, so the more
# specific patterns come first.
OWNERSHIP = [
    # (pattern, current owner group, why this mapping exists)
    ("NORTHROP GRUMMAN INNOVATION SYSTEMS", "Northrop Grumman",
     "Orbital ATK's post-acquisition shell; Northrop acquired Orbital ATK in June 2018"),
    ("ORBITAL ATK", "Northrop Grumman", "acquired by Northrop Grumman, June 2018"),
    ("ORBITAL SCIENCES", "Northrop Grumman", "merged into Orbital ATK, then Northrop"),
    ("ATK ", "Northrop Grumman", "Alliant Techsystems legacy entity, now Northrop"),
    ("ATK LAUNCH", "Northrop Grumman", "ATK Launch Systems, Utah SRM plant, now Northrop"),
    ("AEROJET", "L3Harris", "Aerojet Rocketdyne acquired by L3Harris, July 2023"),
    ("ROCKETDYNE", "L3Harris", "Aerojet Rocketdyne, acquired by L3Harris July 2023"),
    ("NORTHROP", "Northrop Grumman", None),
    ("L3HARRIS", "L3Harris", None),
    ("L3 TECHNOLOGIES", "L3Harris", "L3 Technologies merged with Harris in 2019"),
    ("HARRIS CORP", "L3Harris", "merged with L3 Technologies in 2019"),
    ("LOCKHEED", "Lockheed Martin", None),
    ("RAYTHEON", "RTX", "Raytheon merged with United Technologies to form RTX, 2020"),
    ("UNITED TECHNOLOGIES", "RTX", "merged with Raytheon to form RTX, 2020"),
    ("RTX ", "RTX", None),
    ("BOEING", "Boeing", None),
    ("GENERAL DYNAMICS", "General Dynamics", None),
    ("KONGSBERG", "Kongsberg", None),
    ("LEONARDO DRS", "Leonardo", None),
    ("DRS ", "Leonardo", "DRS Technologies, acquired by Leonardo in 2008"),
    ("KAMAN", "Kaman", None),
    ("HONEYWELL", "Honeywell", None),
    ("CHEMRING", "Chemring", None),
    ("MOOG", "Moog", None),
    ("KRATOS", "Kratos", None),
    ("URSA MAJOR", "Ursa Major", None),
    ("ANDURIL", "Anduril", None),
    ("SPACEX", "SpaceX", None),
    ("SPACE EXPLORATION TECH", "SpaceX", None),
]


def owner_of(parent_name, recipient_name):
    """Apply the ownership hop. Returns (group, reason_or_None, matched_on)."""
    for source, label in ((parent_name, "parent"), (recipient_name, "recipient")):
        if not source:
            continue
        up = source.upper()
        for pattern, group, why in OWNERSHIP:
            if pattern in up:
                return group, why, label
    # No curated rule: fall back to the registered parent, else the recipient itself.
    return titlecase(parent_name or recipient_name), None, "fallback"


def collect_recipients():
    """Unique (recipient_id, name) across every recipient pull we cached."""
    seen = {}
    for src in ("recipients_dod", "recipients_psc1337"):
        if not have_raw(src):
            continue
        for row in load_raw(src).get("results", []):
            rid = row.get("recipient_id")
            if rid:
                seen.setdefault(rid, row.get("name") or "")
    return seen


def main():
    force = "--force" in sys.argv
    recipients = collect_recipients()
    print(f"{len(recipients)} unique recipient entities to resolve")

    cache = {} if force or not have_raw(LOOKUP) else load_raw(LOOKUP)
    missing = [r for r in recipients if r not in cache]
    print(f"{len(cache)} cached, {len(missing)} to fetch")

    def resolve(rid):
        """One entity. Never raises: an unresolved entity falls back to its own name."""
        detail = get(f"recipient/{rid}/", required=False) or {}
        return rid, {"name": detail.get("name") or recipients[rid],
                     "uei": detail.get("uei"),
                     "parent_name": detail.get("parent_name"),
                     "parent_uei": detail.get("parent_uei"),
                     "level": detail.get("recipient_level"),
                     "state": (detail.get("location") or {}).get("state_code"),
                     "resolved": bool(detail)}

    # Modest concurrency: 120 sequential round trips is slow, and one occasionally
    # hanging entity should not stall the rest of the batch.
    if missing:
        done = 0
        with ThreadPoolExecutor(max_workers=8) as pool:
            for rid, rec in pool.map(resolve, missing):
                cache[rid] = rec
                done += 1
                if done % 20 == 0 or done == len(missing):
                    save_raw(LOOKUP, cache)
                    print(f"  resolved {done}/{len(missing)}", flush=True)

    if missing:
        save_raw(LOOKUP, cache)

    out = {}
    for rid, name in recipients.items():
        d = cache.get(rid, {})
        parent = d.get("parent_name")
        group, why, matched = owner_of(parent, d.get("name") or name)
        out[rid] = {"recipient_name": titlecase(d.get("name") or name),
                    "recipient_name_raw": d.get("name") or name,
                    "uei": d.get("uei"),
                    "registered_parent": titlecase(parent) if parent else None,
                    "owner_group": group,
                    "ownership_note": why,
                    "matched_on": matched,
                    "state": d.get("state")}

    with open(OUT, "w") as fh:
        json.dump(out, fh, indent=2, sort_keys=True)

    groups = {}
    for v in out.values():
        groups.setdefault(v["owner_group"], []).append(v["recipient_name"])
    fellback = sum(1 for v in out.values() if v["matched_on"] == "fallback")
    print(f"\n-> {OUT}")
    print(f"{len(out)} entities -> {len(groups)} owner groups "
          f"({fellback} fell back to registered parent/self)")
    print("\nGroups with multiple child entities (these are the rollups that matter):")
    for g, kids in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        if len(kids) > 1:
            print(f"  {g:24s} <- {len(kids)} entities")


if __name__ == "__main__":
    main()
