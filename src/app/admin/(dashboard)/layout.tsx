import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/actions";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AvatarInitials } from "@/components/admin/avatar-initials";

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
      </aside>
      <div className="flex-1 bg-cream/40">
        <div className="flex h-16 items-center justify-end gap-3 border-b border-line bg-surface px-6 sm:px-10">
          <div className="text-right">
            <p className="text-sm text-ink">
              Xin chào, <span className="font-medium capitalize">{displayName}</span>
            </p>
            <p className="text-xs capitalize text-muted">{today}</p>
          </div>
          <AvatarInitials name={displayName} size={38} />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
