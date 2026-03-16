"use client";

import { useState } from "react";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export default function ProductImageGallery({ images }: { images: ProductImage[] }) {
  const primary = images.find(i => i.isPrimary) ?? images[0];
  const [selected, setSelected] = useState<ProductImage | null>(primary ?? null);

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
        {selected ? (
          <img
            key={selected.id}
            src={selected.url}
            alt="Product"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <span className="text-[140px] opacity-20 absolute inset-0 flex items-center justify-center">👔</span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map(img => (
            <button
              key={img.id}
              onClick={() => setSelected(img)}
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