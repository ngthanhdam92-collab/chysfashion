"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { createNavLink } from "@/lib/nav-links-actions";
import { NavLink } from "@/lib/nav-links";

export function AddNavLinkForm({ topLevelLinks }: { topLevelLinks: NavLink[] }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs text-muted" htmlFor="label">
          Tên mục menu
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="Ví dụ: Áo thun Nam"
          className="mt-1 w-48 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="href">
          Đường dẫn
        </label>
        <input
          id="href"
          name="href"
          required
          placeholder="/san-pham?gender=nam&category=ao-thun"
          className="mt-1 w-72 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="parentId">
          Thuộc menu cha
        </label>
        <select
          id="parentId"
          name="parentId"
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
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-ink px-4 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
      >
        <Plus size={15} /> {submitting ? "Đang thêm..." : "Thêm mục"}
      </button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  );
}
