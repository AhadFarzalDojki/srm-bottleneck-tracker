# First-contact emails

Two drafts, because the two outlet types want different things. Trade press wants a
*tip plus data*; an analysis outlet wants a *contributed piece*. Sending the same email
to both is the most common way this kind of outreach dies.

Both lead with the 0.32% finding rather than the 20.2× growth figure. The growth number
invites "well, that's one contract" as the first reply; the classification finding is the
novel one and is hard to argue with. Raise the one-contract caveat yourself, in the body
— being the person who already found the hole in your own number is most of what buys
credibility with a beat reporter.

Keep these short. Both are ~140 words on purpose.

---

## A. Trade press — news desk (Breaking Defense, Defense News, Shephard)

> **Subject:** The "propulsion" contract code is 0.3% propulsion
>
> Hi [name] —
>
> I've been pulling USAspending data on missile propulsion procurement and found
> something that might be useful for your [munitions capacity / industrial base]
> coverage.
>
> The federal industry code named for rocket propulsion manufacturing (NAICS 336415) is
> **0.32% propulsion** by product code. It's 53% complete guided missiles and 32%
> launchers. So anyone tracking the solid rocket motor base through that code is
> measuring missiles.
>
> The one code that does name solid motors — PSC 1337 — has been **flat for a decade**
> (1.5× range, peaking in FY2020, *before* the buildup), and **90.5%** of it goes to a
> single supplier.
>
> Caveat I'd raise myself: DoD obligations in that industry code did grow 20.2×, but one
> Lockheed contract for JAGM/Hellfire production is half of that. Excluding it, 7.3×.
>
> Dashboard: https://srm-bottleneck-tracker.vercel.app
> Code and data: https://github.com/AhadFarzalDojki/srm-bottleneck-tracker
>
> Happy to walk through the method — it's all public API, no auth, and the whole
> pipeline is open.
>
> [your name]

---

## B. Analysis outlet — contributed piece (War on the Rocks, RealClearDefense)

> **Subject:** Pitch: the solid rocket motor bottleneck is invisible in federal contract data
>
> Hi [name] —
>
> I'd like to pitch a short piece (~1,500 words) on something I found in public
> procurement data that I think reframes the missile-shortage debate.
>
> Everyone agrees solid rocket motors are the constraint. But the federal industry code
> named for propulsion manufacturing turns out to be **0.32% propulsion** — it buys
> complete missiles and launchers. The only code that actually names solid motors has
> been flat for ten years and is **90.5%** single-source, while missile procurement in
> the same category rose 20.2× (7.3× excluding one large Lockheed contract).
>
> The argument: during the largest missile buildup in decades, separately-procured motor
> spending never moved and consolidated to one supplier — and the public record gives no
> independent view of motor volume at all. The bottleneck everyone names is the part the
> data cannot see.
>
> Full analysis and dashboard: https://srm-bottleneck-tracker.vercel.app
> Code and data: https://github.com/AhadFarzalDojki/srm-bottleneck-tracker
>
> All USAspending API, reproducible end to end.
>
> [your name]

---

## If asked about the L3Harris / Aerojet mapping

This is the sharpest question a careful reader will ask, so have the answer ready rather
than improvising it. Do not bury it — offer it before they have to ask.

> The ownership rollup groups Aerojet Rocketdyne's awards under L3Harris, which acquired
> it on 28 July 2023 — including awards Aerojet won earlier as an independent company.
> That's the right lens for who controls the capability now and the wrong one for who won
> work then, so I split the window at the closing date. The same single entity — Aerojet
> Rocketdyne Coleman Aerospace — holds **86.3%** of the motor code *before* the
> acquisition and **98.2%** after. The merger transferred an existing near-monopoly; it
> didn't create one.

## Other questions to expect

- **"Isn't this just one contract?"** — Yes, substantially: W31P4Q23C0005 is 51.1% of the
  window. Growth is 7.3× and top-1 share 54.9% (HHI 3,462) without it. Both findings
  survive; neither is as large as the headline.
- **"Doesn't the motor spend just sit inside the missile contracts?"** — Almost certainly,
  and that's the honest limit: this does *not* show motor production stalled. It shows
  separately-procured motor buying stayed flat and that the public record can't see motor
  volume. Concede this immediately; it's the strongest version of the argument anyway.
- **"Why not include rocket ammunition codes?"** — PSC 1340 is unguided/artillery rocket
  ammunition and PSC 1377 is propellant-actuated devices, whose largest recipient is an
  ejection-seat maker. Including them roughly quadruples the apparent motor market and
  collapses the concentration signal. They're counted only in the deliberately generous
  0.32% figure.
- **"Where's Northrop?"** — Largely invisible here, which is itself the point: Utah, home
  of the largest US motor plant, receives 1.2% of these obligations. Prime awards track
  where missiles are assembled, not where motors are cast.

## Sequencing

Trade press first — fastest feedback loop, lowest bar, and they genuinely do run
data-visual stories. Then smaller defense-tech firms and defense-focused investors once
you have a pickup to point to. Do not start with the primes; they won't reply, and a
non-reply costs you the chance to use the finding as a warm intro later.
