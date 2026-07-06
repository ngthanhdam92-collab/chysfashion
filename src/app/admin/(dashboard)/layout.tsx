import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AvatarInitials } from "@/components/admin/avatar-initials";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderNotifier } from "@/components/admin/order-notifier";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const displayName = email.split("@")[0] || "Admin";
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const sidebarContent = (
    <>
      {/* Logo — desktop only (mobile shows in shell header) */}
      <div className="hidden h-16 items-center border-b border-line px-6 lg:flex">
        <span className="font-serif text-xl tracking-[0.1em] text-ink">CHYS</span>
        <span className="ml-2 text-[10px] tracking-label uppercase text-muted">Quản lý</span>
      </div>
      <AdminSidebarNav />
      <div className="border-t border-line p-3">
        <p className="truncate px-3 py-1 text-xs text-muted">{email}</p>
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
    </>
  );

  const headerContent = (
    <>
      <div className="text-right">
        <p className="text-sm text-ink">
          Xin chào, <span className="font-medium capitalize">{displayName}</span>
        </p>
        <p className="hidden text-xs capitalize text-muted sm:block">{today}</p>
      </div>
      <AvatarInitials name={displayName} size={36} />
    </>
  );

  return (
    <>
      <AdminShell sidebar={sidebarContent} header={headerContent}>
        {children}
      </AdminShell>
      <OrderNotifier />
    </>
  );
}
