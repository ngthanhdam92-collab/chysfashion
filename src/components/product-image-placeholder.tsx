const VARIANTS = [
  "from-[#efe7d8] via-[#e4d9c4] to-[#cdbb9a]",
  "from-[#e9e3d6] via-[#d9cfba] to-[#b7a687]",
  "from-[#f1ebe0] via-[#e8ded0] to-[#c9b79c]",
  "from-[#eae4d9] via-[#dcd0ba] to-[#a9843f]/40",
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
