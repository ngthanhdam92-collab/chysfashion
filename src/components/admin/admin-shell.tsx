"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { PullToRefresh } from "./pull-to-refresh";

interface Props {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ sidebar, header, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — dark */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#17181a]">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#17181a] shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl tracking-[0.1em] text-white">CHYS</span>
                <span className="text-[10px] uppercase tracking-label text-white/25">Quản lý</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-white/30 transition-colors hover:text-white/70"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-[#f3f2f0]">
        <PullToRefresh />
        {/* Top bar */}
        <div className="flex h-14 items-center gap-3 border-b border-[#e8e6e2] bg-white px-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] lg:h-16 lg:px-10">
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded p-1.5 text-stone transition-colors hover:text-ink lg:hidden"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-serif text-lg tracking-[0.1em] text-ink lg:hidden">CHYS</span>
          <div className="ml-auto flex items-center gap-3">{header}</div>
        </div>
        <div className="w-full overflow-x-hidden px-4 py-6 sm:px-6 lg:mx-auto lg:max-w-6xl lg:px-10 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
