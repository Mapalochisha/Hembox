import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
  });

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(searchParams.category
        ? { categories: { some: { category: { slug: searchParams.category } } } }
        : {}),
    },
    include: {
      images: { where: { isPrimary: true } },
      variants: { take: 1 },
      categories: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-6 md:px-10 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            {searchParams.category
              ? categories.find(c => c.slug === searchParams.category)?.name ?? "Products"
              : "All Products"}
          </h1>
          <p className="text-xs opacity-40 mt-1 tracking-widest">{products.length} products</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/products"
            className={`px-4 py-2 text-xs tracking-widest uppercase rounded-full border border-[#111] transition-colors ${!searchParams.category ? "bg-[#111] text-white" : "hover:bg-gray-50"}`}>
            All
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}
              className={`px-4 py-2 text-xs tracking-widest uppercase rounded-full border border-[#111] transition-colors ${searchParams.category === cat.slug ? "bg-[#111] text-white" : "hover:bg-gray-50"}`}>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">👔</p>
          <h2 className="text-lg font-semibold mb-2">No products found</h2>
          <p className="text-sm opacity-50 mb-6">Try a different category or check back soon.</p>
          <Link href="/products" className="bg-[#111] text-white text-xs px-6 py-3 rounded tracking-widest uppercase">
            View All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {products.map(product => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group cursor-pointer card-lift rounded-xl">
              <div className="bg-gray-100 rounded-xl h-52 md:h-80 flex items-center justify-center mb-3 md:mb-4 relative overflow-hidden">
                {product.images[0] ? (
                  <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-6xl md:text-8xl opacity-20">👔</span>
                )}
              </div>
              <p className="text-[10px] opacity-35 tracking-widest uppercase mb-1">
                {product.categories[0]?.category.name ?? ""}
              </p>
              <p className="text-xs md:text-sm font-black tracking-wide uppercase mb-1">{product.name}</p>
              <p className="text-xs md:text-sm font-bold">
                K {Number(product.variants[0]?.price ?? 0).toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}