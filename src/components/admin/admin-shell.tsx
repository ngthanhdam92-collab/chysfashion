"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ sidebar, header, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when navigating
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <span className="font-serif text-xl tracking-[0.1em] text-ink">CHYS</span>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-cream/40">
        {/* Top bar */}
        <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:h-16 lg:px-10">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded p-1.5 text-muted hover:text-ink lg:hidden"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          {/* Logo — mobile only, center */}
          <span className="font-serif text-lg tracking-[0.1em] text-ink lg:hidden">CHYS</span>
          {/* Header content (date + avatar) */}
          <div className="ml-auto flex items-center gap-3">{header}</div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
