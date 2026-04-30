"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Library, Star } from "lucide-react";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/collections")
      .then((res) => res.json())
      .then((data) => {
        setCollections(data);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    const res = await fetch(`/api/admin/collections/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setCollections(collections.filter((c) => c.id !== id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Collections</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your seasonal and thematic collections</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black transition-colors"
        >
          <Plus size={16} />
          Add Collection
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-[#2D2D2D] font-medium">
            <tr>
              <th className="px-6 py-4">Collection</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Products</th>
              <th className="px-6 py-4">Featured</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Loading collections...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  No collections found.
                </td>
              </tr>
            ) : (
              collections.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <Library size={18} className="text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium text-[#2D2D2D]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.slug}</td>
                  <td className="px-6 py-4 text-gray-500">{c._count?.products || 0}</td>
                  <td className="px-6 py-4">
                    {c.featured && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Star size={10} fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/collections/${c.id}/edit`}
                        className="p-2 text-gray-400 hover:text-[#2D2D2D] transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
