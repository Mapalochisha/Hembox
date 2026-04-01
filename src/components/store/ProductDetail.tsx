"use client";

import { useState } from "react";
import ProductImageGallery from "@/components/store/ProductImageGallery";
import AddToCartButton from "@/components/store/AddToCartButton";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Variant {
  id: string;
  sku: string;
  price: any;
  comparePrice: any;
  inventory: number;
  attributes: any;
}

interface Props {
  images: ProductImage[];
  product: {
    id: string;
    name: string;
    slug: string;
    variants: Variant[];
    images: ProductImage[];
  };
  category: string;
  lowestPrice: number;
  highestCompare: number;
  description: string;
  tags: string[];
}

export default function ProductDetail({
  images,
  product,
  category,
  lowestPrice,
  highestCompare,
  description,
  tags,
}: Props) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  return (
    <>
      {/* Left — Image gallery */}
      <ProductImageGallery images={images} externalIndex={activeImageIndex} />

      {/* Right — All product info + variant pickers */}
      <div className="flex flex-col">
        {/* Category */}
        {category && (
          <p className="text-[10px] tracking-[4px] opacity-35 uppercase mb-3">
            {category}
          </p>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight mb-4">
          {product.name}
        </h1>

        {/* Price */}
        <div className="flex items-center gap-3 mb-6">
          <p className="text-2xl font-bold">K {lowestPrice.toFixed(2)}</p>
          {highestCompare > 0 && (
            <p className="text-base opacity-35 line-through">K {highestCompare.toFixed(2)}</p>
          )}
          {highestCompare > 0 && (
            <span className="bg-[#111] text-white text-[9px] px-2 py-1 tracking-widest rounded font-bold">
              SALE
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm opacity-55 leading-relaxed mb-8 max-w-md">{description}</p>
        )}

        {/* Variant pickers + Add to Cart + Wishlist */}
        <AddToCartButton product={product} onImageChange={setActiveImageIndex} />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 mt-6 flex-wrap">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] tracking-widest uppercase border border-gray-200 px-3 py-1 rounded-full opacity-50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Perks */}
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
          <p className="text-xs opacity-40">📦 Free shipping on orders over K 500</p>
          <p className="text-xs opacity-40">↩ Easy 30-day returns</p>
          <p className="text-xs opacity-40">✓ Authentic HemBox quality</p>
        </div>
      </div>
    </>
  );
}