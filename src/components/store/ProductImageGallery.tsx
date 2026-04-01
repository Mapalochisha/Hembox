"use client";

import { useState, useEffect, useRef } from "react";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Props {
  images: ProductImage[];
  externalIndex?: number | null;
}

type SlideDirection = "left" | "right" | "up";

export default function ProductImageGallery({ images, externalIndex }: Props) {
  const primary = images.find(i => i.isPrimary) ?? images[0];
  const [selected, setSelected] = useState<ProductImage | null>(primary ?? null);
  const [prevImage, setPrevImage] = useState<ProductImage | null>(null);
  const [direction, setDirection] = useState<SlideDirection>("right");
  const [animating, setAnimating] = useState(false);
  const currentIndexRef = useRef(images.findIndex(i => i.id === primary?.id));

  function switchImage(img: ProductImage, dir: SlideDirection) {
    if (img.id === selected?.id || animating) return;
    setPrevImage(selected);
    setDirection(dir);
    setAnimating(true);
    setSelected(img);
    setTimeout(() => {
      setPrevImage(null);
      setAnimating(false);
    }, 320);
  }

  function handleThumbnailClick(img: ProductImage, i: number) {
    const dir = i > currentIndexRef.current ? "right" : "left";
    currentIndexRef.current = i;
    switchImage(img, dir);
  }

  useEffect(() => {
    if (externalIndex !== null && externalIndex !== undefined && images[externalIndex]) {
      const img = images[externalIndex];
      const dir: SlideDirection = externalIndex > currentIndexRef.current ? "right" : "left";
      currentIndexRef.current = externalIndex;
      switchImage(img, dir);
    }
  }, [externalIndex]);

  const enterFrom: Record<SlideDirection, string> = {
    right: "translate-x-full",
    left: "-translate-x-full",
    up: "translate-y-full",
  };

  if (!images.length) {
    return (
      <div className="bg-gray-100 rounded-xl h-[380px] md:h-[520px] flex items-center justify-center">
        <span className="text-[140px] opacity-20">👔</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="bg-gray-100 rounded-xl h-[380px] md:h-[520px] overflow-hidden mb-3 relative">
        {/* Outgoing image */}
        {prevImage && (
          <img
            src={prevImage.url}
            alt="Product"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out
              ${direction === "right" ? "-translate-x-full" : direction === "left" ? "translate-x-full" : "-translate-y-full"}`}
          />
        )}

        {/* Incoming image */}
        {selected && (
          <img
            src={selected.url}
            alt="Product"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out
              ${animating ? enterFrom[direction] : "translate-x-0 translate-y-0"}`}
            style={{
              transform: animating ? undefined : "translate(0,0)",
            }}
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => handleThumbnailClick(img, i)}
              className={`bg-gray-100 rounded-lg h-20 overflow-hidden border-2 transition-all duration-200 btn-press
                ${selected?.id === img.id ? "border-[#111]" : "border-transparent hover:border-gray-300"}`}>
              <img src={img.url} alt="Product thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}