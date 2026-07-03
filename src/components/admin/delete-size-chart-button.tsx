"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSizeChartTemplate } from "@/lib/size-chart-actions";

export function DeleteSizeChartButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        Xóa &quot;{name}&quot;?
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteSizeChartTemplate(id);
            })
          }
          className="font-medium text-error hover:underline"
        >
          Xác nhận
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-muted hover:underline"
        >
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
      aria-label={`Xóa ${name}`}
    >
      <Trash2 size={16} />
    </button>
  );
}
