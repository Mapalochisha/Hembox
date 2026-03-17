"use client";
import { useState } from "react";
import { useCart } from "@/components/store/CartProvider";

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
  slug: string;
  variants: Variant[];
  images: { url: string; isPrimary: boolean }[];
}

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);

  const primaryImage = product.images.find(i => i.isPrimary)?.url ?? product.images[0]?.url ?? null;

  // Get all unique attribute keys across all variants in consistent order
  const attributeKeys: string[] = [];
  product.variants.forEach(v => {
    Object.keys(v.attributes ?? {}).forEach(key => {
      if (!attributeKeys.includes(key)) attributeKeys.push(key);
  });
  });
  attributeKeys.sort();

  // For each attribute key, get unique values
  const attributeOptions = attributeKeys.map(key => ({
    key,
    values: Array.from(new Set(product.variants.map(v => v.attributes?.[key]).filter(Boolean))) as string[],
  }));

  // Track selected attributes
  const initialAttrs: Record<string, string> = {};
  if (product.variants.length === 1) {
    Object.entries(product.variants[0].attributes ?? {}).forEach(([k, v]) => {
      initialAttrs[k] = v as string;
    });
  }
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(initialAttrs);

  function handleAttrSelect(key: string, value: string) {
  // If already selected, unselect it
  if (selectedAttrs[key] === value) {
    const newAttrs = { ...selectedAttrs };
    delete newAttrs[key];
    setSelectedAttrs(newAttrs);
    setSelectedVariant(null);
    return;
  }

  const newAttrs = { ...selectedAttrs, [key]: value };
  setSelectedAttrs(newAttrs);

  // Find matching variant
  const match = product.variants.find(v =>
    Object.entries(newAttrs).every(([k, val]) => v.attributes?.[k] === val)
  );
  setSelectedVariant(match ?? null);
  }

  function isAttrSelected(key: string, value: string) {
    return selectedAttrs[key] === value;
  }

  function isVariantAvailable(key: string, value: string) {
    const testAttrs = { ...selectedAttrs, [key]: value };
    return product.variants.some(v =>
      Object.entries(testAttrs).every(([k, val]) => v.attributes?.[k] === val) && v.inventory > 0
    );
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      image: primaryImage,
      price: Number(selectedVariant.price),
      comparePrice: selectedVariant.comparePrice ? Number(selectedVariant.comparePrice) : null,
      sku: selectedVariant.sku,
      attributes: selectedVariant.attributes ?? {},
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const allAttrsSelected = attributeKeys.every(key => selectedAttrs[key]);

  return (
    <div className="space-y-4">
      {/* Attribute selectors */}
      {attributeOptions.map(({ key, values }) => (
        <div key={key}>
          <p className="text-[10px] tracking-[3px] uppercase opacity-40 mb-3">
            Select {key}
            {selectedAttrs[key] && <span className="ml-2 opacity-70">— {selectedAttrs[key]}</span>}
          </p>
          <div className="flex gap-2 flex-wrap">
            {values.map(value => {
              const available = isVariantAvailable(key, value);
              const selected = isAttrSelected(key, value);
              return (
                <button key={value}
                  onClick={() => handleAttrSelect(key, value)}
                  disabled={!available}
                  className={`px-3 h-11 border text-xs font-semibold transition-colors rounded btn-press min-w-[44px]
                    ${selected
                      ? "bg-[#111] text-white border-[#111]"
                      : !available
                      ? "opacity-30 cursor-not-allowed border-gray-200 line-through"
                      : "border-[#111] hover:bg-gray-50"
                    }`}>
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add to cart */}
      <button onClick={handleAddToCart} disabled={!selectedVariant || !allAttrsSelected || added}
        className={`w-full py-4 text-xs tracking-widest uppercase font-bold transition-colors rounded btn-press
          ${added
            ? "bg-green-700 text-white"
            : !selectedVariant || !allAttrsSelected
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#111] text-white hover:bg-black"
          }`}>
        {added ? "✓ Added to Cart" : !allAttrsSelected ? "Select Options" : "Add to Cart"}
      </button>

      <button className="w-full py-4 text-xs tracking-widest uppercase font-bold border border-[#111] hover:bg-gray-50 transition-colors rounded btn-press">
        Add to Wishlist
      </button>
    </div>
  );
}