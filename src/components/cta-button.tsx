import Link from "next/link";
import { ReactNode } from "react";

const VARIANTS = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  light: "bg-paper text-ink hover:bg-cream",
  goldOutline: "border border-gold text-paper hover:bg-gold",
};

export function CtaButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center px-7 py-3 text-[12px] tracking-label uppercase transition-colors ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
