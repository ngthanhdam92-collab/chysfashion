import { ReactNode } from "react";

export function SimplePage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-[12px] tracking-label uppercase text-gold-dark">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-muted">
        {children}
      </div>
    </div>
  );
}
