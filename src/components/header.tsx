"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { NavLink } from "@/lib/nav-links";

export function Header({ navLinks }: { navLinks: NavLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur">
      <div className="bg-ink py-2 text-center text-[11px] tracking-label uppercase text-paper">
        Miễn phí vận chuyển cho đơn hàng từ 500.000đ
      </div>
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
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="text-[13px] tracking-label uppercase text-ink transition-colors hover:text-gold-dark"
            >
              {link.label}
            </Link>
          ))}
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
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-line py-3 text-sm tracking-label uppercase text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
