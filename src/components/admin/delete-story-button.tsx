"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStory } from "@/lib/stories-actions";

export function DeleteStoryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Xoá story này?")) return;
        startTransition(async () => { await deleteStory(id); });
      }}
      className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={13} />
      {isPending ? "Đang xoá…" : "Xoá"}
    </button>
  );
}
