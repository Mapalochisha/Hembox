import Link from "next/link";
import { db } from "@/lib/db";
import HeroSection from "@/components/store/HeroSection";

export default async function HomePage() {
  const featuredProducts = await db.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      images: { where: { isPrimary: true } },
      variants: { take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const featuredCategories = await db.category.findMany({
    where: { featured: true, parentId: null },
    orderBy: { position: "asc" },
    take: 3,
  });

  return (
    <div>
      <HeroSection categories={featuredCategories} />

      {/* New Drops */}
      <div className="px-6 md:px-10 py-14">
        <h2 className="text-2xl font-black tracking-tight uppercase mb-2">NEW DROPS</h2>
        <p className="text-xs opacity-50 mb-9 max-w-sm leading-relaxed">
          Stand out with our latest collection — quality fabrics and refined fits.
        </p>

        {featuredProducts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Classic Oxford Shirt", price: "K 450", tag: "New", emoji: "👔", cat: "Men" },
              { name: "Linen Summer Dress", price: "K 380", tag: "Sale", emoji: "👗", cat: "Women" },
              { name: "Slim Fit Chinos", price: "K 320", tag: null, emoji: "👖", cat: "Men" },
            ].map((p) => (
              <div key={p.name} className="cursor-pointer group">
                <div className="bg-gray-100 rounded-xl h-72 flex items-center justify-center mb-4 relative overflow-hidden">
                  <span className="text-8xl">{p.emoji}</span>
                  {p.tag && <span className="absolute top-3 left-3 bg-[#111] text-white text-[9px] px-2.5 py-1 tracking-widest font-bold rounded">{p.tag.toUpperCase()}</span>}
                </div>
                <p className="text-[11px] font-black tracking-widest uppercase mb-1">{p.name}</p>
                <p className="text-[11px] opacity-45 mb-2">{p.cat}</p>
                <p className="text-sm font-bold">{p.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="cursor-pointer group">
                <div className="bg-gray-100 rounded-xl h-72 flex items-center justify-center mb-4 relative overflow-hidden">
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-8xl opacity-20">👔</span>
                  )}
                </div>
                <p className="text-[11px] font-black tracking-widest uppercase mb-1">{product.name}</p>
                <p className="text-sm font-bold">K {Number(product.variants[0]?.price ?? 0).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/products"
            className="bg-[#111] text-white px-10 py-3.5 text-xs tracking-widest uppercase inline-block hover:bg-black transition-colors rounded">
            View All Products
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 md:px-10 pb-14">
        <p className="text-xs tracking-widest opacity-35 uppercase mb-6">Hot Deals</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredCategories.length > 0 ? featuredCategories.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`} className="group cursor-pointer card-lift rounded-xl">
              <div className="bg-gray-100 h-64 flex items-center justify-center mb-4 rounded relative overflow-hidden">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-8xl opacity-20">👔</span>
                )}
              </div>
              <p className="text-sm font-semibold text-center mb-3">{cat.name}</p>
              <div className="text-center">
                <span className="bg-[#111] text-white text-xs px-5 py-2 rounded-full tracking-widest cursor-pointer">SHOP NOW →</span>
              </div>
            </Link>
          )) : (
            [{ label: "Men", emoji: "👔", slug: "men" }, { label: "Women", emoji: "👗", slug: "women" }, { label: "Kids", emoji: "🧒", slug: "kids" }].map(cat => (
              <Link key={cat.label} href={`/categories/${cat.slug}`} className="group cursor-pointer card-lift rounded-xl">
                <div className="bg-gray-100 h-64 flex items-center justify-center mb-4 rounded">
                  <span className="text-8xl">{cat.emoji}</span>
                </div>
                <p className="text-sm font-semibold text-center mb-3">{cat.label}</p>
                <div className="text-center">
                  <span className="bg-[#111] text-white text-xs px-5 py-2 rounded-full tracking-widest cursor-pointer">SHOP NOW →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Banner */}
      <div className="mx-6 md:mx-10 mb-14 bg-gray-100 rounded-xl px-8 md:px-16 py-16 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        <span className="text-[120px] opacity-15">👗</span>
        <div>
          <p className="text-xs tracking-[4px] opacity-40 uppercase mb-3">Best Minimal Collection</p>
          <h2 className="text-4xl font-light mb-3 leading-tight">Crafted for<br />everyday living.</h2>
          <p className="opacity-45 text-sm mb-6 leading-relaxed max-w-sm">
            Quality you can feel, style you can own. Free shipping on orders over K 500.
          </p>
          <Link href="/products"
            className="bg-[#111] text-white text-xs px-8 py-3 rounded-full tracking-widest uppercase hover:bg-black transition-colors inline-block">
            SHOP NOW
          </Link>
        </div>
      </div>
    </div>
  );
}