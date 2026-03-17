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

function normalizeValue(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function sortAttributeKeys(keys: string[]): string[] {
  const preferred = ["Color", "Size"];
  const result: string[] = [];

  for (const p of preferred) {
    const match = keys.find(k => k.toLowerCase() === p.toLowerCase());
    if (match) result.push(match);
  }

  for (const k of keys.sort()) {
    const alreadyAdded = result.some(r => r.toLowerCase() === k.toLowerCase());
    if (!alreadyAdded) result.push(k);
  }

  return result;
}

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    product.variants.length === 1
      ? Object.fromEntries(
          Object.entries(product.variants[0].attributes ?? {}).map(([k, v]) => [k, normalizeValue(v as string)])
        )
      : {}
  );
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);

  const primaryImage = product.images.find(i => i.isPrimary)?.url ?? product.images[0]?.url ?? null;

  // Collect all unique attribute keys in preferred order
  const rawKeys: string[] = [];
  product.variants.forEach(v => {
    Object.keys(v.attributes ?? {}).forEach(key => {
      if (!rawKeys.includes(key)) rawKeys.push(key);
    });
  });
  const attributeKeys = sortAttributeKeys(rawKeys);

  // For each key get unique normalized values
  const attributeOptions = attributeKeys.map(key => ({
    key,
    values: Array.from(new Set(
      product.variants
        .map(v => v.attributes?.[key])
        .filter(Boolean)
        .map(normalizeValue)
    )) as string[],
  }));

  function handleAttrSelect(key: string, value: string) {
    if (selectedAttrs[key] === value) {
      const newAttrs = { ...selectedAttrs };
      delete newAttrs[key];
      setSelectedAttrs(newAttrs);
      setSelectedVariant(null);
      return;
    }

    const newAttrs = { ...selectedAttrs, [key]: value };
    setSelectedAttrs(newAttrs);

    const match = product.variants.find(v =>
      Object.entries(newAttrs).every(([k, val]) =>
        normalizeValue(v.attributes?.[k]) === normalizeValue(val)
      )
    );
    setSelectedVariant(match ?? null);
  }

  function isSelected(key: string, value: string) {
    return selectedAttrs[key] === value;
  }

  function isAvailable(key: string, value: string) {
    return product.variants.some(v => {
      if (normalizeValue(v.attributes?.[key]) !== normalizeValue(value)) return false;
      if (v.inventory === 0) return false;
      return Object.entries(selectedAttrs).every(([k, val]) => {
        if (k === key) return true;
        return normalizeValue(v.attributes?.[k]) === normalizeValue(val);
      });
    });
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
      {attributeOptions.map(({ key, values }) => (
        <div key={key}>
          <p className="text-[10px] tracking-[3px] uppercase opacity-40 mb-3">
            Select {key}
            {selectedAttrs[key] && (
              <span className="ml-2 opacity-70 normal-case">— {selectedAttrs[key]}</span>
            )}
          </p>
          <div className="flex flex-row gap-2 flex-wrap">
            {values.map(value => (
              <button
                key={value}
                onClick={() => handleAttrSelect(key, value)}
                disabled={!isAvailable(key, value)}
                className={`px-3 h-11 border text-xs font-semibold transition-colors rounded btn-press min-w-[44px]
                  ${isSelected(key, value)
                    ? "bg-[#111] text-white border-[#111]"
                    : !isAvailable(key, value)
                    ? "opacity-30 cursor-not-allowed border-gray-200 line-through"
                    : "border-[#111] hover:bg-gray-50"
                  }`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant || !allAttrsSelected || added}
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