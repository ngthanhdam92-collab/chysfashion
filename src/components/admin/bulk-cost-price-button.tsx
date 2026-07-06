"use client";

import { useState } from "react";
import { bulkSetCostPrice } from "@/lib/products-actions";

export function BulkCostPriceButton({ amount }: { amount: number }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await bulkSetCostPrice(amount);
    setLoading(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => window.location.reload(), 800);
    } else {
      alert("Lỗi: " + result.error);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || done}
      className="shrink-0 bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
    >
      {done ? "✓ Đã cập nhật" : loading ? "Đang xử lý..." : `Đặt giá vốn ${amount.toLocaleString("vi-VN")}đ cho tất cả SP`}
    </button>
  );
}
