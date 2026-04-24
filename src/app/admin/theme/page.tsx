"use client";

import { useState, useEffect } from "react";
import SingleImageUploader from "@/components/admin/SingleImageUploader";
import { Loader2, Save, CheckCircle2, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  featured: boolean;
}

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, catsRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/admin/categories"),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
        }
        if (catsRes.ok) {
          const data = await catsRes.json();
          setCategories(data.filter((c: Category) => c.featured));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setStatus({ type: "success", message: "Theme settings have been updated successfully." });
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to save theme settings. Please try again." });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Theme Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customize the appearance of your store</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#111] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {/* Hero Carousel Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#2D2D2D] mb-1">Hero Carousel</h2>
          <p className="text-sm text-gray-500">
            The homepage hero carousel is powered by your <strong>featured categories</strong>. Each featured category with an uploaded image becomes a slide.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            To manage hero slides, go to <Link href="/admin/categories" className="font-semibold underline">Categories</Link>, mark categories as <strong>Featured</strong>, and upload a <strong>Collection Banner Image</strong> on each one.
          </p>
        </div>

        {categories.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Current Hero Slides ({categories.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/admin/categories/${cat.id}/edit`}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-20">🖼️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2D2D2D] truncate">{cat.name}</p>
                    <p className="text-xs text-gray-500">
                      {cat.imageUrl ? (
                        <span className="text-green-600">✓ Image uploaded</span>
                      ) : (
                        <span className="text-amber-600">⚠ No image — slide will use placeholder</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Edit →</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">No featured categories yet.</p>
            <Link href="/admin/categories" className="text-sm text-[#111] underline mt-1 inline-block">
              Go to Categories →
            </Link>
          </div>
        )}
      </div>

      {/* Additional Theme Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4 border-b pb-2">Promotional Banner</h2>
          <div className="max-w-xl">
            <SingleImageUploader
              label="Homepage Banner Image"
              value={settings.theme_promo_banner || ""}
              onChange={(url) => handleChange("theme_promo_banner", url)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended size: 1920x600px. This image is displayed in the promotional section of the homepage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
