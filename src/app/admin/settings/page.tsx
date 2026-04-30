import { db } from "@/lib/db";
import Link from "next/link";
import { Edit } from "lucide-react";

export default async function SettingsPage() {
  const settings = await db.storeSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Store configuration</p>
        </div>
        <Link
          href="/admin/settings/edit"
          className="flex items-center gap-2 px-4 py-2 bg-[#2D2D2D] text-white text-sm font-medium rounded-md hover:bg-black transition-colors"
        >
          <Edit size={16} />
          Edit Settings
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-[#2D2D2D]">Store Details</h2>
        {[
          { key: "store_name",            label: "Store Name" },
          { key: "store_currency",        label: "Currency" },
          { key: "store_currency_symbol", label: "Currency Symbol" },
          { key: "store_country",         label: "Country" },
          { key: "store_email",           label: "Store Email" },
        ].map((field) => (
          <div key={field.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700">{field.label}</span>
            <span className="text-sm text-gray-600">{map[field.key] ?? "—"}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-4">
        <h2 className="font-semibold text-[#2D2D2D]">Shipping & Tax</h2>
        {[
          { key: "default_shipping_cost",   label: "Default Shipping Cost" },
          { key: "free_shipping_threshold", label: "Free Shipping Over" },
          { key: "tax_rate",                label: "Tax Rate (%)" },
        ].map((field) => (
          <div key={field.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700">{field.label}</span>
            <span className="text-sm text-gray-600">{map[field.key] ?? "—"}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-4">
        <h2 className="font-semibold text-[#2D2D2D]">About Us</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
          {map["about_us"] ?? "No content provided."}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-4">
        <h2 className="font-semibold text-[#2D2D2D]">Privacy Policy</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
          {map["privacy_policy"] ?? "No content provided."}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mt-4">
        <h2 className="font-semibold text-[#2D2D2D]">Terms & Conditions</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
          {map["terms_conditions"] ?? "No content provided."}
        </p>
      </div>
    </div>
  );
}