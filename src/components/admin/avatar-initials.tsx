const PALETTE = [
  "bg-gold/20 text-gold-dark",
  "bg-success/15 text-success",
  "bg-ink/10 text-ink",
  "bg-error/15 text-error",
];

function hashToIndex(seed: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function AvatarInitials({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const colorClass = PALETTE[hashToIndex(name, PALETTE.length)];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-medium ${colorClass}`}
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </span>
  );
}
