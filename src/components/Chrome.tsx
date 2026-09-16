/**
 * Shared page furniture: section headings, cards, and the caveat callout.
 * Server components -- no interactivity, so they stay out of the client bundle.
 */
import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {lede && (
        <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          {lede}
        </div>
      )}
      <div className="mt-7">{children}</div>
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
 * The caveat callout. Used wherever a number could be read as a stronger claim
 * than the data supports -- which, in this project, is most of them.
 */
export function Caveat({
  label = "Read this before quoting the number",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--alert)]">
        {label}
      </p>
      <div className="text-[13.5px] leading-relaxed text-[var(--muted)]">{children}</div>
    </div>
  );
}
