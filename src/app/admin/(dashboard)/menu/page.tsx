import { Fragment } from "react";
import { getNavLinks } from "@/lib/nav-links";
import { getCategories } from "@/lib/categories";
import { NavLinkRow } from "@/components/admin/nav-link-row";
import { AddNavLinkForm } from "@/components/admin/add-nav-link-form";

export default async function AdminMenuPage() {
  const [links, categories] = await Promise.all([getNavLinks(), getCategories()]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Menu điều hướng</h1>
      <p className="mb-4 text-sm text-muted">
        Đây là các mục hiển thị trên thanh menu đầu trang. Để tạo menu con: chọn menu cha
        (ví dụ Nam), chọn một danh mục có sẵn (ví dụ Áo thun) — đường dẫn sẽ tự tạo, khách
        trỏ chuột vào menu cha sẽ thấy danh mục sổ xuống và bấm vào là ra đúng sản phẩm.
        Dùng mũi tên để sắp xếp thứ tự trong cùng một cấp.
      </p>

      <div className="mb-6 border border-line bg-surface p-5">
        <AddNavLinkForm topLevelLinks={links} categories={categories} />
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
            {links.map((link) => (
              <Fragment key={link.id}>
                <NavLinkRow
                  link={link}
                  isFirst={links[0].id === link.id}
                  isLast={links[links.length - 1].id === link.id}
                />
                {link.children.map((child) => (
                  <NavLinkRow
                    key={child.id}
                    link={child}
                    isChild
                    isFirst={link.children[0].id === child.id}
                    isLast={link.children[link.children.length - 1].id === child.id}
                  />
                ))}
              </Fragment>
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
