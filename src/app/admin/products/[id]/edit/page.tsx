"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Variant {
  id?: string;
  sku: string;
  price: string;
  comparePrice: string;
  inventory: string;
  attributes: { key: string; value: string }[];
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; parentId: string | null }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${params.id}`).then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([data, cats]) => {
      setName(data.name);
      setSlug(data.slug);
      setDescription(data.description ?? "");
      setStatus(data.status);
      setVariants(
        data.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          price: v.price.toString(),
          comparePrice: v.comparePrice?.toString() ?? "",
          inventory: v.inventory.toString(),
          attributes: Object.entries(v.attributes ?? {}).map(([key, value]) => ({
            key,
            value: value as string,
          })),
        }))
      );
      setSelectedCategories(data.categories.map((c: any) => c.categoryId));
      setCategories(cats);
      setFetching(false);
    });
  }, [params.id]);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function addVariant() {
    setVariants([...variants, { sku: "", price: "", comparePrice: "", inventory: "0", attributes: [] }]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof Variant, value: string) {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  }

  function addAttribute(vi: number) {
    const updated = [...variants];
    updated[vi].attributes.push({ key: "", value: "" });
    setVariants(updated);
  }

  function updateAttribute(vi: number, ai: number, field: "key" | "value", value: string) {
    const updated = [...variants];
    updated[vi].attributes[ai][field] = value;
    setVariants(updated);
  }

  function removeAttribute(vi: number, ai: number) {
    const updated = [...variants];
    updated[vi].attributes = updated[vi].attributes.filter((_, i) => i !== ai);
    setVariants(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, description, status, selectedCategories,
          variants: variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            price: parseFloat(v.price),
            comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
            inventory: parseInt(v.inventory),
            attributes: Object.fromEntries(v.attributes.map((a) => [a.key, a.value])),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
      } else {
        router.push("/admin/products");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/admin/products/${params.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2D2D]">Edit Product</h1>
            <p className="text-gray-500 text-sm mt-0.5">{name}</p>
          </div>
        </div>
        <button onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 text-sm font-medium rounded-md hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-[#2D2D2D]">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] bg-white">
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-[#2D2D2D]">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">No categories found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 rounded border-gray-300 accent-[#2D2D2D]"
                  />
                  <span className={`text-sm ${cat.parentId ? "text-gray-500 pl-3" : "text-gray-700 font-medium"}`}>
                    {cat.parentId ? `└ ${cat.name}` : cat.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2D2D2D]">Variants & Pricing</h2>
            <button type="button" onClick={addVariant}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50">
              <Plus size={12} /> Add Variant
            </button>
          </div>
          {variants.map((variant, vi) => (
            <div key={vi} className="border border-gray-200 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Variant {vi + 1}</p>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(vi)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                  <input type="text" value={variant.sku} onChange={(e) => updateVariant(vi, "sku", e.target.value)} required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Inventory</label>
                  <input type="number" value={variant.inventory} onChange={(e) => updateVariant(vi, "inventory", e.target.value)} min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (K)</label>
                  <input type="number" value={variant.price} onChange={(e) => updateVariant(vi, "price", e.target.value)} required min="0" step="0.01"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Compare Price (K)</label>
                  <input type="number" value={variant.comparePrice} onChange={(e) => updateVariant(vi, "comparePrice", e.target.value)} min="0" step="0.01"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Attributes</label>
                  <button type="button" onClick={() => addAttribute(vi)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <Plus size={10} /> Add
                  </button>
                </div>
                {variant.attributes.map((attr, ai) => (
                  <div key={ai} className="flex gap-2 mb-2">
                    <input type="text" value={attr.key} onChange={(e) => updateAttribute(vi, ai, "key", e.target.value)} placeholder="Size"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]" />
                    <input type="text" value={attr.value} onChange={(e) => updateAttribute(vi, ai, "value", e.target.value)} placeholder="M"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D2D2D]" />
                    <button type="button" onClick={() => removeAttribute(vi, ai)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/admin/products"
            className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}