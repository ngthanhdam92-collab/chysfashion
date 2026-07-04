"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shirt,
  Tag,
  Menu,
  Receipt,
  Users,
  Ruler,
  Image,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Cửa hàng",
    items: [
      { href: "/admin/products", label: "Sản phẩm", icon: Shirt },
      { href: "/admin/categories", label: "Danh mục", icon: Tag },
      { href: "/admin/size-charts", label: "Bảng size", icon: Ruler },
      { href: "/admin/banners", label: "Banner", icon: Image },
      { href: "/admin/menu", label: "Menu điều hướng", icon: Menu },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      { href: "/admin/orders", label: "Đơn hàng", icon: Receipt },
      { href: "/admin/customers", label: "Khách hàng", icon: Users },
    ],
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[10px] font-medium tracking-label uppercase text-stone">
            {group.label}
          </p>
          <div className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-gold bg-gold/10 font-medium text-gold-dark"
                      : "border-transparent text-ink hover:bg-cream"
                  }`}
                >
                  <item.icon size={17} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
