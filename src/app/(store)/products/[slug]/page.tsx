import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/store/AddToCartButton";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      variants: true,
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!product || product.status !== "ACTIVE") notFound();

  const lowestPrice = Math.min(...product.variants.map(v => Number(v.price)));
  const highestCompare = Math.max(...product.variants.map(v => Number(v.comparePrice ?? 0)));

  return (
    <div className="px-6 md:px-10 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs opacity-40 tracking-widest uppercase mb-8">
        <Link href="/" className="hover:opacity-80">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:opacity-80">Products</Link>
        <span>/</span>
        <span className="opacity-100 text-[#111]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        {/* Images */}
        <div>
          <div className="bg-gray-100 rounded-xl h-[380px] md:h-[520px] flex items-center justify-center relative overflow-hidden mb-3">
            {product.images[0] ? (
              <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[140px] opacity-20">👔</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="bg-gray-100 rounded-lg h-20 overflow-hidden">
                  <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-2">
          <p className="text-[10px] tracking-[4px] opacity-35 uppercase mb-3">
            {product.categories[0]?.category.name ?? ""}
          </p>
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
              <span className="bg-[#111] text-white text-[9px] px-2 py-1 tracking-widest rounded font-bold">SALE</span>
            )}
          </div>

          {product.description && (
            <p className="text-sm opacity-55 leading-relaxed mb-8 max-w-md">{product.description}</p>
          )}

          <AddToCartButton product={product} />

          {product.tags.length > 0 && (
            <div className="flex gap-2 mt-6 flex-wrap">
              {product.tags.map(t => (
                <span key={t.tag.id} className="text-[10px] tracking-widest uppercase border border-gray-200 px-3 py-1 rounded-full opacity-50">
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
            <p className="text-xs opacity-40">📦 Free shipping on orders over K 500</p>
            <p className="text-xs opacity-40">↩ Easy 30-day returns</p>
            <p className="text-xs opacity-40">✓ Authentic HemBox quality</p>
          </div>
        </div>
      </div>
    </div>
  );
}