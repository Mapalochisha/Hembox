"use client";

import { useState } from "react";

interface Variant {
  id: string;
  sku: string;
  price: any;
  comparePrice: any;
  inventory: number;
  attributes: any;
}

interface Product {
  id: string;
  name: string;
  variants: Variant[];
}

export default function AddToCartButton({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);

  const sizes = product.variants
    .map(v => ({ variant: v, size: v.attributes?.Size ?? v.attributes?.size ?? v.sku }))
    .filter(v => v.size);

  function handleAddToCart() {
    if (!selectedVariant) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Size selector */}
      {sizes.length > 1 && (
        <div>
          <p className="text-[10px] tracking-[3px] uppercase opacity-40 mb-3">Select Size</p>
          <div className="flex gap-2 flex-wrap">
            {sizes.map(({ variant, size }) => (
              <button key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                disabled={variant.inventory === 0}
                className={`w-11 h-11 border text-xs font-semibold transition-colors rounded
                  ${selectedVariant?.id === variant.id
                    ? "bg-[#111] text-white border-[#111]"
                    : variant.inventory === 0
                    ? "opacity-30 cursor-not-allowed border-gray-200"
                    : "border-[#111] hover:bg-gray-50"
                  }`}>
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant || added}
        className={`w-full py-4 text-xs tracking-widest uppercase font-bold transition-colors rounded
          ${added
            ? "bg-green-700 text-white"
            : !selectedVariant
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#111] text-white hover:bg-black"
          }`}>
        {added ? "✓ Added to Cart" : !selectedVariant ? "Select a Size" : "Add to Cart"}
      </button>

      {/* Wishlist */}
      <button className="w-full py-4 text-xs tracking-widest uppercase font-bold border border-[#111] hover:bg-gray-50 transition-colors rounded">
        Add to Wishlist
      </button>
    </div>
  );
}