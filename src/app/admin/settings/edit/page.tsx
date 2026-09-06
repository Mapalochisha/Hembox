"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload } from "lucide-react";

export default function EditSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setFetching(false);
      })
      .catch(() => {
        setError("Failed to load settings.");
        setFetching(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (key: string, file: File | undefined) => {
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setError("Please upload a .txt file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSettings((prev) => ({ ...prev, [key]: content }));
    };
    reader.readAsText(file);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save settings.");
      }

      router.push("/admin/settings");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  interface FieldItem {
    key: string;
    label: string;
    textarea?: boolean;
    uploadable?: boolean;
  }

  interface FieldSection {
    section: string;
    items: FieldItem[];
  }

  const fields: FieldSection[] = [
    { section: "Store Details", items: [
      { key: "store_name", label: "Store Name" },
      { key: "store_email", label: "Store Email" },
      { key: "store_currency", label: "Currency (e.g. ZMW)" },
      { key: "store_currency_symbol", label: "Currency Symbol (e.g. K)" },
      { key: "store_country", label: "Country" },
    ]},
    { section: "Tax", items: [
      { key: "tax_rate", label: "Tax Rate (%)" },
    ]},
    { section: "Content & Legal", items: [
      { key: "about_us", label: "About Us", textarea: true, uploadable: true },
      { key: "privacy_policy", label: "Privacy Policy", textarea: true, uploadable: true },
      { key: "terms_conditions", label: "Terms & Conditions", textarea: true, uploadable: true },
    ]},
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Edit Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update your store configuration</p>
        </div>
      </div>

      <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Shipping prices, destinations, couriers, zones, tiers, and rates are managed in the Shipping admin section.
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((section) => (
          <div key={section.section} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-[#2D2D2D]">{section.section}</h2>
            <div className="grid gap-4">
              {section.items.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                    {field.uploadable && (
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 cursor-pointer hover:text-blue-700">
                        <Upload size={10} />
                        Upload .txt
                        <input
                          type="file"
                          accept=".txt"
                          className="hidden"
                          onChange={(e) => handleFileUpload(field.key, e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                  {field.textarea ? (
                    <textarea
                      value={settings[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D] resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={settings[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2D2D]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/settings"
            className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
