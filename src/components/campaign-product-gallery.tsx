"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  name: string;
}

export function CampaignProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (!images.length) return null;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                i === active ? "border-red-500" : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
