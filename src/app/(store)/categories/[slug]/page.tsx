import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await db.category.findUnique({
    where: { slug: params.slug },
    include: {
      children: true,
    },
  });

  if (!category) notFound();

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      categories: {
        some: {
          category: {
            OR: [
              { slug: params.slug },
              { parent: { slug: params.slug } },
            ],
          },
        },
      },
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
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs opacity-40 tracking-widest uppercase mb-4">
          <Link href="/" className="hover:opacity-80">Home</Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight uppercase mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-sm opacity-50 max-w-md leading-relaxed">{category.description}</p>
        )}
        <p className="text-xs opacity-40 tracking-widest mt-2">{products.length} products</p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          <Link href={`/categories/${category.slug}`}
            className="px-4 py-2 text-xs tracking-widest uppercase rounded-full border border-[#111] bg-[#111] text-white">
            All
          </Link>
          {category.children.map(child => (
            <Link key={child.id} href={`/categories/${child.slug}`}
              className="px-4 py-2 text-xs tracking-widest uppercase rounded-full border border-[#111] hover:bg-gray-50 transition-colors">
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">👔</p>
          <h2 className="text-lg font-semibold mb-2">No products yet</h2>
          <p className="text-sm opacity-50 mb-6">Check back soon or browse all products.</p>
          <Link href="/products"
            className="bg-[#111] text-white text-xs px-6 py-3 rounded tracking-widest uppercase">
            View All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {products.map(product => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group cursor-pointer">
              <div className="bg-gray-100 rounded-xl h-52 md:h-80 flex items-center justify-center mb-3 md:mb-4 relative overflow-hidden">
                {product.images[0] ? (
                  <img src={product.images[0].url} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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