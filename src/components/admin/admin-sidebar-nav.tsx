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
  LayoutTemplate,
  CirclePlay,
  Ticket,
  Truck,
  Flame,
  BarChart3,
  Settings,
  Calculator,
  TrendingUp,
  Warehouse,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Kinh doanh",
    items: [
      { href: "/admin/orders", label: "Đơn hàng", icon: Receipt },
      { href: "/admin/analytics", label: "Phân tích", icon: BarChart3 },
      { href: "/admin/loi-nhuan", label: "Báo cáo lợi nhuận", icon: TrendingUp },
      { href: "/admin/chi-phi", label: "Chi phí & Lợi nhuận", icon: Calculator },
      { href: "/admin/customers", label: "Khách hàng", icon: Users },
      { href: "/admin/promotions", label: "Khuyến mại", icon: Ticket },
      { href: "/admin/flash-sales", label: "Flash Sale", icon: Flame },
      { href: "/admin/shipping", label: "Vận chuyển", icon: Truck },
      { href: "/admin/kho", label: "Quản lý kho", icon: Warehouse },
    ],
  },
  {
    label: "Cửa hàng",
    items: [
      { href: "/admin/products", label: "Sản phẩm", icon: Shirt },
      { href: "/admin/categories", label: "Danh mục", icon: Tag },
      { href: "/admin/size-charts", label: "Bảng size", icon: Ruler },
      { href: "/admin/banners", label: "Banner", icon: Image },
      { href: "/admin/stories", label: "Stories / Feedback", icon: CirclePlay },
      { href: "/admin/homepage", label: "Trang chủ", icon: LayoutTemplate },
      { href: "/admin/menu", label: "Menu điều hướng", icon: Menu },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/settings", label: "Cài đặt", icon: Settings },
    ],
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[10px] font-semibold tracking-label uppercase text-white/20">
            {group.label}
          </p>
          <div className="mt-1.5 space-y-0.5">
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
                      ? "border-[#c9a459] bg-[#c9a459]/10 font-medium text-[#e8d4a0]"
                      : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/75"
                  }`}
                >
                  <item.icon size={16} strokeWidth={1.75} className="shrink-0" />
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
