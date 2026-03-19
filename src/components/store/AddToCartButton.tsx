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

interface Props {
  product: Product;
  onImageChange?: (index: number | null) => void;
}

function normalizeValue(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function AddToCartButton({ product, onImageChange }: Props) {
  const { addItem } = useCart();

  // Collect attribute keys — master key first, exclude internal _ keys
  const attributeKeys: string[] = [];
  const masterKey = product.variants[0]?.attributes?._masterKey;
  if (masterKey) attributeKeys.push(masterKey);
  product.variants.forEach(v => {
    Object.keys(v.attributes ?? {}).forEach(key => {
      if (!key.startsWith("_") && !attributeKeys.includes(key)) attributeKeys.push(key);
    });
  });

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    product.variants.length === 1
      ? Object.fromEntries(
          Object.entries(product.variants[0].attributes ?? {})
            .filter(([k]) => !k.startsWith("_"))
            .map(([k, v]) => [k, normalizeValue(v as string)])
        )
      : {}
  );
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);

  const primaryImage = product.images.find(i => i.isPrimary)?.url ?? product.images[0]?.url ?? null;

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
      onImageChange?.(null);
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

    // Update image if master attribute selected and has linked image
    if (key === masterKey && match) {
      const linkedIndex = match.attributes?._linkedImageIndex;
      if (linkedIndex !== undefined && linkedIndex !== "") {
        onImageChange?.(parseInt(linkedIndex));
      } else {
        onImageChange?.(null);
      }
    }
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
      attributes: Object.fromEntries(
        Object.entries(selectedVariant.attributes ?? {}).filter(([k]) => !k.startsWith("_"))
      ),
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