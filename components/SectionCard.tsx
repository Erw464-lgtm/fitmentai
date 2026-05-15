import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  eyebrow,
  title,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-lg border border-line bg-panel/95 p-6 shadow-glow ${className}`}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-volt">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold text-[#f3ead5] md:text-3xl">{title}</h2>
      <div className="mt-5 text-sm leading-6 text-[#b8ac91] md:text-base">{children}</div>
    </section>
  );
}
