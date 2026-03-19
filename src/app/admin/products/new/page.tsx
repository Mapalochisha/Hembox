"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import VariantBuilder, { VariantGroup } from "@/components/admin/VariantBuilder";
import { flattenVariantGroups } from "@/lib/variants";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [categories, setCategories] = useState<{ id: string; name: string; parentId: string | null }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [images, setImages] = useState<{ url: string; publicId: string; isPrimary: boolean }[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(data => setCategories(data));
  }, []);

  function generateSlug(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function handleNameChange(val: string) {
    setName(val);
    setSlug(generateSlug(val));
  }

  function toggleCategory(id: string) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Product name is required."); return; }

    const variants = flattenVariantGroups(variantGroups, slug);
    if (variantGroups.length > 0 && variants.length === 0) {
      setError("Please add at least one sub-attribute value to your variant groups.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, description, status, selectedCategories,
          images: images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId,
            isPrimary: img.isPrimary,
            position: i,
          })),
          variants,
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Add Product</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create a new product</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-[#2D2D2D]">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} required
              placeholder="e.g. Classic White T-Shirt"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL)</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required
              placeholder="classic-white-t-shirt"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]" />
            <p className="text-xs text-gray-400 mt-1">Auto-generated from name. Used in the product URL.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Describe the product..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] bg-white">
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-[#2D2D2D] mb-4">Product Images</h2>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* Categories */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-[#2D2D2D]">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">No categories found. Create categories first.</p>
          ) : (
            <div className="space-y-3">
              {categories.filter(cat => !cat.parentId).map(parent => (
                <div key={parent.id} className="border border-gray-100 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={selectedCategories.includes(parent.id)}
                      onChange={() => toggleCategory(parent.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-[#2D2D2D]" />
                    <span className="text-sm font-semibold text-gray-800">{parent.name}</span>
                  </label>
                  {categories.filter(cat => cat.parentId === parent.id).length > 0 && (
                    <div className="pl-6 space-y-1.5 border-l border-gray-100 ml-2">
                      {categories.filter(cat => cat.parentId === parent.id).map(child => (
                        <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={selectedCategories.includes(child.id)}
                            onChange={() => toggleCategory(child.id)}
                            className="w-4 h-4 rounded border-gray-300 accent-[#2D2D2D]" />
                          <span className="text-sm text-gray-600">{child.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-[#2D2D2D] mb-4">Product Variants</h2>
          <VariantBuilder
            groups={variantGroups}
            onChange={setVariantGroups}
            productSlug={slug}
            images={images}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black disabled:opacity-50 transition-colors">
            {loading ? "Saving..." : "Save Product"}
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