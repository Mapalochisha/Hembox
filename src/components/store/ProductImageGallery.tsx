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

type ScrollDirection = "left" | "right";

export default function ProductImageGallery({ images, externalIndex }: Props) {
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  const [selected, setSelected] = useState<ProductImage | null>(primary ?? null);
  const [prevImage, setPrevImage] = useState<ProductImage | null>(null);
  const [direction, setDirection] = useState<ScrollDirection>("right");
  const [animating, setAnimating] = useState(false);
  // Track whether the incoming image has been "activated" (triggers the CSS transition)
  const [entered, setEntered] = useState(false);
  const currentIndexRef = useRef(images.findIndex((i) => i.id === primary?.id));

  function switchImage(img: ProductImage, dir: ScrollDirection) {
    if (img.id === selected?.id || animating) return;
    setPrevImage(selected);
    setDirection(dir);
    setAnimating(true);
    setEntered(false); // start off-screen
    setSelected(img);

    // Use a small rAF delay so the browser paints the off-screen position first,
    // then we trigger the transition to translateX(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntered(true);
      });
    });

    setTimeout(() => {
      setPrevImage(null);
      setAnimating(false);
      setEntered(false);
    }, 400);
  }

  function handleThumbnailClick(img: ProductImage, i: number) {
    const dir = i > currentIndexRef.current ? "right" : "left";
    currentIndexRef.current = i;
    switchImage(img, dir);
  }

  useEffect(() => {
    if (
      externalIndex !== null &&
      externalIndex !== undefined &&
      images[externalIndex]
    ) {
      const img = images[externalIndex];
      const dir: ScrollDirection =
        externalIndex > currentIndexRef.current ? "right" : "left";
      currentIndexRef.current = externalIndex;
      switchImage(img, dir);
    }
  }, [externalIndex]);

  if (!images.length) {
    return (
      <div className="bg-gray-100 rounded-xl h-[380px] md:h-[520px] flex items-center justify-center">
        <span className="text-[140px] opacity-20">👔</span>
      </div>
    );
  }

  // --- Transform calculations ---
  // Scrolling RIGHT: new enters from +100% (right side), old exits to -100% (left side)
  // Scrolling LEFT:  new enters from -100% (left side),  old exits to +100% (right side)

  const outgoingTransform = animating
    ? direction === "right"
      ? "translateX(-100%)" // exits left
      : "translateX(100%)"  // exits right
    : "translateX(0)";

  const incomingTransform =
    prevImage && animating
      ? entered
        ? "translateX(0)"   // final position: centered
        : direction === "right"
          ? "translateX(100%)"  // starts off-screen right
          : "translateX(-100%)" // starts off-screen left
      : "translateX(0)";

  return (
    <div>
      {/* Main image */}
      <div className="bg-gray-100 rounded-xl h-[380px] md:h-[520px] overflow-hidden mb-3 relative">
        {/* Outgoing image */}
        {prevImage && (
          <img
            src={prevImage.url}
            alt="Product"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] ease-in-out"
            style={{
              transform: outgoingTransform,
              zIndex: 1,
            }}
          />
        )}

        {/* Incoming image */}
        {selected && (
          <img
            src={selected.url}
            alt="Product"
            className={`absolute inset-0 w-full h-full object-cover ease-in-out ${
              prevImage && animating
                ? "transition-transform duration-[400ms]"
                : ""
            }`}
            style={{
              transform: incomingTransform,
              zIndex: 2,
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
                ${
                  selected?.id === img.id
                    ? "border-[#111]"
                    : "border-transparent hover:border-gray-300"
                }`}
            >
              <img
                src={img.url}
                alt="Product thumbnail"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}