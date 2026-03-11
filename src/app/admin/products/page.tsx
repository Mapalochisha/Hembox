import Link from "next/link";
import { db } from "@/lib/db";
import { Plus, Pencil, Package } from "lucide-react";

export default async function ProductsPage() {
  const products = await db.product.findMany({
    include: {
      images: { where: { isPrimary: true } },
      variants: true,
      categories: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} products total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
          <Package size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 font-medium mb-1">No products yet</h3>
          <p className="text-gray-500 text-sm mb-4">Add your first product to get started.</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2D2D] text-white text-sm rounded-md hover:bg-black transition-colors"
          >
            <Plus size={16} />
            Add Product
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Variants</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-gray-400 text-xs">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.status === "ACTIVE"   ? "bg-green-100 text-green-700" :
                      product.status === "DRAFT"    ? "bg-gray-100 text-gray-600" :
                                                      "bg-red-100 text-red-600"
                    }`}>
                      {product.status.charAt(0) + product.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.variants.length}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {product.categories[0]?.category.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}