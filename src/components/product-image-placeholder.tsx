const VARIANTS = [
  "from-white via-[#f7f5f1] to-[#ebe6dc]",
  "from-white via-[#f5f3ee] to-[#e3ddd0]",
  "from-[#fbfaf8] via-[#f2efe8] to-[#e8e1d2]",
  "from-white via-[#f6f4ef] to-[#a9843f]/15",
];

function hashToIndex(seed: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function ProductImagePlaceholder({
  seed,
  label,
  className = "",
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  const variant = VARIANTS[hashToIndex(seed, VARIANTS.length)];
  return (
    <div
      className={`relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-gradient-to-br ${variant} ${className}`}
    >
      <span className="font-serif text-3xl tracking-[0.2em] text-ink/15 select-none">
        CHYS
      </span>
      {label ? (
        <span className="absolute bottom-3 left-3 text-[11px] tracking-label uppercase text-ink/40">
          {label}
        </span>
      ) : null}
    </div>
  );
}
