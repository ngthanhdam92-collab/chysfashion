"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteReturnRecord } from "@/lib/return-records";

export function DeleteReturnButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteReturnRecord(id);
      router.refresh();
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="rounded bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "..." : "Xóa"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded border border-line px-2 py-1 text-[11px] text-muted hover:text-ink"
        >
          Không
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="rounded p-1 text-muted hover:bg-line hover:text-red-600"
      title="Xóa bản ghi hoàn này"
    >
      <Trash2 size={14} />
    </button>
  );
}
