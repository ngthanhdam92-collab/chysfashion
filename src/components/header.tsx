"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { useCart } from "@/context/cart-context";
import type { NavLink } from "@/lib/nav-links";
import type { AnnouncementBar } from "@/lib/homepage-settings";

interface HeaderProps {
  navLinks: NavLink[];
  announcement: AnnouncementBar;
}

export function Header({ navLinks, announcement }: HeaderProps) {
  const { totalCount } = useCart();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/san-pham?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur">
      {/* Announcement bar */}
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

      {/* Main header row */}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo — always left */}
        <Link href="/" className="mr-2 flex shrink-0 flex-col items-center leading-none">
          <span className="font-serif text-xl tracking-[0.12em] text-ink sm:text-2xl">CHYS</span>
          <span className="text-[8px] tracking-[0.32em] uppercase text-muted">Fashion</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 lg:flex">
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

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex flex-1 items-center">
          <div className="flex w-full items-center border border-line bg-white px-3 py-1.5 focus-within:border-gold">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <button type="submit" aria-label="Tìm kiếm">
              <Search size={16} className="text-muted hover:text-ink" />
            </button>
          </div>
        </form>

        {/* Action icons */}
        <div className="flex shrink-0 items-center">
          <button className="hidden p-2 sm:inline-flex" aria-label="Tài khoản" type="button">
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

      {/* Mobile nav strip — horizontal scroll thay cho hamburger menu */}
      <div className="flex overflow-x-auto border-t border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className="shrink-0 whitespace-nowrap px-4 py-2 text-[11px] tracking-label uppercase text-ink hover:text-gold-dark"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
