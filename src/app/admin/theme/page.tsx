"use client";

import { useState, useEffect } from "react";
import SingleImageUploader from "@/components/admin/SingleImageUploader";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
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

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4 border-b pb-2">Hero Section</h2>
          <div className="max-w-xl">
            <SingleImageUploader
              label="Hero Background Image"
              value={settings.theme_hero_image || ""}
              onChange={(url) => handleChange("theme_hero_image", url)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended size: 1920x1080px. This image will be displayed at the top of the homepage.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
