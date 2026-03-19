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
}

export default function ProductDetail({ images, product }: Props) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
      <ProductImageGallery images={images} externalIndex={activeImageIndex} />
      <AddToCartButton product={product} onImageChange={setActiveImageIndex} />
    </div>
  );
}