import { db } from "@/lib/db";

export default async function SettingsPage() {
  const settings = await db.storeSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Store configuration</p>
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

      <p className="text-xs text-gray-400 mt-4">Settings editing coming in a later update.</p>
    </div>
  );
}