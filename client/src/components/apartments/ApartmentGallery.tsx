"use client";

import { useState } from "react";
import Image from "next/image";
import type { ApartmentImage } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { isExternalUrl } from "@/lib/utils/is-external-url";

interface ApartmentGalleryProps {
  images: ApartmentImage[];
  unitName: string;
}

export function ApartmentGallery({ images, unitName }: ApartmentGalleryProps) {
  const [selected, setSelected] = useState(0);
  const hasImages = images.length > 0;
  const activeUrl = hasImages ? images[selected].url : "/apartment-placeholder.svg";

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-surface-muted">
        <Image
          src={activeUrl}
          alt={unitName}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          preload
          className="object-cover"
          unoptimized={isExternalUrl(activeUrl)}
        />
      </div>
      {hasImages && images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-current={index === selected}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-md border",
                index === selected ? "border-brand" : "border-border",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={isExternalUrl(image.url)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
