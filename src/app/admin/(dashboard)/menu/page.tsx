import { getNavLinks } from "@/lib/nav-links";
import { NavLinkRow } from "@/components/admin/nav-link-row";
import { AddNavLinkForm } from "@/components/admin/add-nav-link-form";

export default async function AdminMenuPage() {
  const links = await getNavLinks();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Menu điều hướng</h1>
      <p className="mb-4 text-sm text-muted">
        Đây là các mục hiển thị trên thanh menu đầu trang của website. Dùng mũi tên để sắp
        xếp thứ tự.
      </p>

      <div className="mb-6 border border-line bg-surface p-5">
        <AddNavLinkForm />
      </div>

      <div className="border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
              <th className="px-4 py-3">Thứ tự</th>
              <th className="px-4 py-3">Tên mục</th>
              <th className="px-4 py-3">Đường dẫn</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, i) => (
              <NavLinkRow
                key={link.id}
                link={link}
                isFirst={i === 0}
                isLast={i === links.length - 1}
              />
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Chưa có mục menu nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
