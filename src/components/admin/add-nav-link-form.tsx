"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { createNavLink } from "@/lib/nav-links-actions";
import { NavLink } from "@/lib/nav-links";
import { Category } from "@/lib/categories";

function buildCategoryHref(categoryValue: string, parent?: NavLink) {
  // Nếu menu cha đang lọc theo giới tính (ví dụ /san-pham?gender=nam)
  // thì menu con kế thừa bộ lọc đó để chỉ hiện sản phẩm đúng giới tính.
  const genderMatch = parent?.href.match(/gender=(nam|nu)/);
  const params = new URLSearchParams();
  if (genderMatch) params.set("gender", genderMatch[1]);
  params.set("category", categoryValue);
  return `/san-pham?${params.toString()}`;
}

export function AddNavLinkForm({
  topLevelLinks,
  categories,
}: {
  topLevelLinks: NavLink[];
  categories: Category[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"category" | "custom">("category");
  const [parentId, setParentId] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const parent = topLevelLinks.find((l) => l.id === parentId);

  function applyCategory(value: string, nextParentId = parentId) {
    setCategoryValue(value);
    const category = categories.find((c) => c.value === value);
    if (!category) return;
    const nextParent = topLevelLinks.find((l) => l.id === nextParentId);
    setLabel(category.label);
    setHref(buildCategoryHref(category.value, nextParent));
  }

  function handleParentChange(nextParentId: string) {
    setParentId(nextParentId);
    // Đổi menu cha thì cập nhật lại đường dẫn theo giới tính của cha mới
    if (mode === "category" && categoryValue) {
      applyCategory(categoryValue, nextParentId);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await createNavLink(formData);
    setSubmitting(false);
    if (result && "error" in result) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    setParentId("");
    setCategoryValue("");
    setLabel("");
    setHref("");
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="flex gap-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "category"}
            onChange={() => setMode("category")}
          />
          Từ danh mục có sẵn
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "custom"}
            onChange={() => setMode("custom")}
          />
          Tự nhập đường dẫn
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted" htmlFor="parentId">
            Thuộc menu cha
          </label>
          <select
            id="parentId"
            name="parentId"
            value={parentId}
            onChange={(e) => handleParentChange(e.target.value)}
            className="mt-1 w-48 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          >
            <option value="">— Mục cấp 1 (không có cha) —</option>
            {topLevelLinks.map((link) => (
              <option key={link.id} value={link.id}>
                {link.label}
              </option>
            ))}
          </select>
        </div>

        {mode === "category" && (
          <div>
            <label className="text-xs text-muted" htmlFor="categoryValue">
              Chọn danh mục
            </label>
            <select
              id="categoryValue"
              value={categoryValue}
              onChange={(e) => applyCategory(e.target.value)}
              className="mt-1 w-48 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
            >
              <option value="">— Chọn danh mục —</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs text-muted" htmlFor="label">
            Tên hiển thị trên menu
          </label>
          <input
            id="label"
            name="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={mode === "category" ? "Tự điền khi chọn danh mục" : "Ví dụ: Về chúng tôi"}
            className="mt-1 w-48 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {mode === "custom" ? (
          <div>
            <label className="text-xs text-muted" htmlFor="href">
              Đường dẫn
            </label>
            <input
              id="href"
              name="href"
              required
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/ve-chung-toi"
              className="mt-1 w-72 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
          </div>
        ) : (
          <input type="hidden" name="href" value={href} />
        )}

        <button
          type="submit"
          disabled={submitting || (mode === "category" && !href)}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          <Plus size={15} /> {submitting ? "Đang thêm..." : "Thêm mục"}
        </button>
      </div>

      {mode === "category" && href && (
        <p className="text-xs text-muted">
          Đường dẫn tự tạo: <span className="text-ink">{href}</span>
          {parent && ` — khách bấm vào sẽ thấy sản phẩm ${label} thuộc menu ${parent.label}`}
        </p>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
    </form>
  );
}
