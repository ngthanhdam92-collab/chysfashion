"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X, ArrowUp, ArrowDown } from "lucide-react";
import { NavLink } from "@/lib/nav-links";
import { updateNavLink, deleteNavLink, moveNavLink } from "@/lib/nav-links-actions";

export function NavLinkRow({
  link,
  isFirst,
  isLast,
  isChild = false,
}: {
  link: NavLink;
  isFirst: boolean;
  isLast: boolean;
  isChild?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(link.label);
  const [href, setHref] = useState(link.href);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("label", label);
    formData.set("href", href);
    startTransition(async () => {
      const result = await updateNavLink(link.id, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNavLink(link.id);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      await moveNavLink(link.id, direction);
    });
  }

  return (
    <tr className={`border-b border-line last:border-0 ${isChild ? "bg-cream/20" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={isFirst || isPending}
            onClick={() => handleMove("up")}
            className="text-muted hover:text-ink disabled:opacity-30"
            aria-label="Di chuyển lên"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            disabled={isLast || isPending}
            onClick={() => handleMove("down")}
            className="text-muted hover:text-ink disabled:opacity-30"
            aria-label="Di chuyển xuống"
          >
            <ArrowDown size={14} />
          </button>
        </div>
      </td>
      <td className="px-4 py-3" style={isChild ? { paddingLeft: "2rem" } : undefined}>
        {isChild && <span className="mr-1.5 text-muted">↳</span>}
        {editing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="text-ink">{link.label}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            className="w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
          />
        ) : (
          <span className="text-muted">{link.href}</span>
        )}
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {editing ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="p-1.5 text-success hover:opacity-70"
                aria-label="Lưu"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setLabel(link.label);
                  setHref(link.href);
                }}
                className="p-1.5 text-muted hover:text-ink"
                aria-label="Hủy"
              >
                <X size={16} />
              </button>
            </>
          ) : confirmingDelete ? (
            <span className="inline-flex items-center gap-2 text-xs">
              Xóa?
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="font-medium text-error hover:underline"
              >
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-muted hover:underline"
              >
                Hủy
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 text-muted hover:text-gold-dark"
                aria-label={`Sửa ${link.label}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="p-1.5 text-muted hover:text-error"
                aria-label={`Xóa ${link.label}`}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
