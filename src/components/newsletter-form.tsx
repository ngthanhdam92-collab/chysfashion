"use client";

import { useState, FormEvent } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-sm text-sand">
        Cảm ơn bạn đã đăng ký! Ưu đãi sẽ được gửi tới email của bạn.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Nhập email của bạn"
        className="w-full border border-stone/40 bg-transparent px-3 py-2.5 text-sm text-paper placeholder:text-stone focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 bg-gold px-4 py-2.5 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-gold-dark"
      >
        Đăng ký
      </button>
    </form>
  );
}
