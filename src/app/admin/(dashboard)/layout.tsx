import Link from "next/link";
import { LayoutDashboard, Shirt, Tag, Menu, Receipt, Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Shirt },
  { href: "/admin/categories", label: "Danh mục", icon: Tag },
  { href: "/admin/menu", label: "Menu điều hướng", icon: Menu },
  { href: "/admin/orders", label: "Đơn hàng", icon: Receipt },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex h-16 items-center border-b border-line px-6">
          <span className="font-serif text-xl tracking-[0.1em] text-ink">
            CHYS
          </span>
          <span className="ml-2 text-[10px] tracking-label uppercase text-muted">
            Quản lý
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-ink hover:bg-cream"
            >
              <item.icon size={17} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <p className="truncate px-3 py-1 text-xs text-muted">{user?.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-ink hover:bg-cream"
            >
              <LogOut size={17} strokeWidth={1.75} />
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1 bg-cream/40">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
