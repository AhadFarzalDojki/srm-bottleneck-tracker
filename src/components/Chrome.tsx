/**
 * Shared page furniture. Server components -- no interactivity, so they stay out of
 * the client bundle.
 *
 * Two deliberate choices here:
 *
 * `Section` takes a `tone`. Findings and limitations should not look alike: a reader
 * skimming headings must be able to tell which sections are claims and which are
 * disclosures about what the data cannot support. The tier-two subaward section is a
 * limitation, not a sixth finding, and is styled as one.
 *
 * `Caveat` is deliberately quiet. An earlier version gave every caveat an
 * alert-coloured uppercase label; with five of them on the page the effect was a wall
 * of warnings that a reader learns to skip, which defeats the point. The caveats now
 * read as margin notes, with emphasis reserved for the single one that changes how a
 * number should be quoted.
 */
import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  lede,
  tone = "finding",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  tone?: "finding" | "limitation";
  children?: ReactNode;
}) {
  const limitation = tone === "limitation";
  return (
    <section
      id={id}
      className={`scroll-mt-16 border-t border-[var(--border)] ${
        limitation ? "bg-[var(--bg-sunk)]" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">
        {eyebrow && (
          <p
            className={`mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              limitation ? "text-[var(--faint)]" : "text-[var(--primary)]"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-balance font-semibold tracking-tight ${
            limitation
              ? "text-[19px] text-[var(--muted)] sm:text-[21px]"
              : "text-[23px] sm:text-[28px]"
          }`}
        >
          {title}
        </h2>
        {lede && (
          <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            {lede}
          </div>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * A margin note on a number. `emphasis` is for the one case where misreading the figure
 * would produce a materially wrong claim.
 */
export function Caveat({
  label,
  emphasis = false,
  children,
}: {
  label: string;
  emphasis?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`mt-5 border-l-2 pl-4 ${
        emphasis ? "border-[var(--primary)]" : "border-[var(--border)]"
      }`}
    >
      <p
        className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
          emphasis ? "text-[var(--primary)]" : "text-[var(--faint)]"
        }`}
      >
        {label}
      </p>
      <div className="max-w-2xl text-[13.5px] leading-relaxed text-[var(--muted)]">
        {children}
      </div>
    </div>
  );
}

/** Sticky section nav. The page is long; without this the method notes are unreachable. */
export function Nav({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 overflow-x-auto px-5 py-2.5">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--faint)]">
          SRM tracker
        </span>
        <div className="flex items-center gap-3.5">
          {items.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              className="shrink-0 text-[12.5px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              {i.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
