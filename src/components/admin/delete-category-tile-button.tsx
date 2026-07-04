"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategoryTile } from "@/lib/category-tiles-actions";

export function DeleteCategoryTileButton({ id, label }: { id: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        Xóa &quot;{label}&quot;?
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => { await deleteCategoryTile(id); })}
          className="font-medium text-error hover:underline"
        >
          Xác nhận
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-muted hover:underline">
          Hủy
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="p-1.5 text-muted hover:text-error"
      aria-label={`Xóa ${label}`}
    >
      <Trash2 size={16} />
    </button>
  );
}
