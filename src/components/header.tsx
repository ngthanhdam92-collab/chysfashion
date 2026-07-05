"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { NavLink } from "@/lib/nav-links";
import type { AnnouncementBar } from "@/lib/homepage-settings";

interface HeaderProps {
  navLinks: NavLink[];
  announcement: AnnouncementBar;
}

export function Header({ navLinks, announcement }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur">
      {announcement.enabled && (
        <div
          className={`py-2 text-center ${
            announcement.fontStyle === "serif"
              ? "font-serif text-sm"
              : announcement.fontStyle === "uppercase"
              ? "text-[11px] tracking-widest uppercase"
              : "text-sm"
          }`}
          style={{ backgroundColor: announcement.bgColor, color: announcement.textColor }}
        >
          {announcement.text}
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          className="p-2 lg:hidden"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex flex-col items-center leading-none">
          <span className="font-serif text-2xl tracking-[0.12em] text-ink">
            CHYS
          </span>
          <span className="text-[9px] tracking-[0.32em] uppercase text-muted">
            Fashion
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) =>
            link.children.length > 0 ? (
              <div key={link.id} className="group relative py-2">
                <Link
                  href={link.href}
                  className="flex items-center gap-1 text-[13px] tracking-label uppercase text-ink transition-colors hover:text-gold-dark"
                >
                  {link.label}
                  <ChevronDown size={13} />
                </Link>
                <div className="invisible absolute left-1/2 top-full w-52 -translate-x-1/2 border border-line bg-surface opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  {link.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-cream hover:text-gold-dark"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                className="text-[13px] tracking-label uppercase text-ink transition-colors hover:text-gold-dark"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-1">
          <button
            className="hidden p-2 sm:inline-flex"
            aria-label="Tìm kiếm"
            type="button"
          >
            <Search size={19} />
          </button>
          <button
            className="hidden p-2 sm:inline-flex"
            aria-label="Tài khoản"
            type="button"
          >
            <User size={19} />
          </button>
          <Link href="/gio-hang" className="relative p-2" aria-label="Giỏ hàng">
            <ShoppingBag size={19} />
            {totalCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] text-paper">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col border-t border-line bg-paper px-4 py-4 lg:hidden">
          {navLinks.map((link) =>
            link.children.length > 0 ? (
              <details key={link.id} className="group border-b border-line py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-sm tracking-label uppercase text-ink">
                  {link.label}
                  <ChevronDown
                    size={15}
                    className="transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="flex flex-col pb-2 pl-3">
                  {link.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      onClick={() => setMenuOpen(false)}
                      className="py-2 text-sm text-muted hover:text-ink"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line py-3 text-sm tracking-label uppercase text-ink"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}
