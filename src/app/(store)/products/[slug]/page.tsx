import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetail from "@/components/store/ProductDetail";

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
        <ProductDetail
          images={product.images}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            variants: product.variants,
            images: product.images,
          }}
          category={product.categories[0]?.category.name ?? ""}
          lowestPrice={lowestPrice}
          highestCompare={highestCompare}
          description={product.description ?? ""}
          tags={product.tags.map(t => t.tag.name)}
        />
      </div>
    </div>
  );
}