"use client";

import { useState } from "react";
import Image from "next/image";
import { StoryViewer } from "./story-viewer";
import type { Story } from "@/lib/stories";

interface Props {
  stories: Story[];
}

export function StoryCircles({ stories }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (stories.length === 0) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 sm:justify-center sm:overflow-visible sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map((story, i) => (
          <button
            key={story.id}
            type="button"
            onClick={() => { setInitialIndex(i); setViewerOpen(true); }}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            {/* Gradient ring */}
            <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-br from-gold via-amber-400 to-rose-400 p-[2.5px]">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-cream">
                <Image
                  src={story.imageUrl}
                  alt={story.customerName || "Story"}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="62px"
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {viewerOpen && (
        <StoryViewer
          stories={stories}
          initialIndex={initialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
