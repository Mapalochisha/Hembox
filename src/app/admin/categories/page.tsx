import Link from "next/link";
import { db } from "@/lib/db";
import { Plus, Pencil, FolderOpen } from "lucide-react";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { parentId: null },
    include: { children: true, products: true },
    orderBy: { position: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Categories</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} top-level categories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Add Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
          <FolderOpen size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 font-medium mb-1">No categories yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first category to organise your products.</p>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2D2D] text-white text-sm rounded-md hover:bg-black transition-colors"
          >
            <Plus size={16} />
            Add Category
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Subcategories</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Products</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Featured</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <>
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cat.children.length}</td>
                    <td className="px-4 py-3 text-gray-600">{cat.products.length}</td>
                    <td className="px-4 py-3">
                      {cat.featured ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Yes</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Pencil size={12} />
                        Edit
                      </Link>
                    </td>
                  </tr>
                  {cat.children.map((child) => (
                    <tr key={child.id} className="hover:bg-gray-50 transition-colors bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-gray-300">└</span>
                          <span className="text-gray-600">{child.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">—</td>
                      <td className="px-4 py-2.5 text-gray-400">—</td>
                      <td className="px-4 py-2.5 text-gray-400">—</td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/admin/categories/${child.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={12} />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}