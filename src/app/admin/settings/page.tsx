"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Globe,
  Truck,
  Receipt,
  ShoppingBag,
  CreditCard,
  Bell,
  Share2,
  Save,
  Check,
  Loader2,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  AlertTriangle,
  Upload,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsMap = Record<string, string>;

type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        value ? "bg-[#2D2D2D]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          value ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="sm:col-span-1">
        <p className="text-sm font-medium text-[#2D2D2D]">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  return (
    <div className="flex items-center rounded-md border border-gray-200 focus-within:border-[#2D2D2D] focus-within:ring-1 focus-within:ring-[#2D2D2D] transition-all bg-white overflow-hidden">
      {prefix && (
        <span className="px-3 text-sm text-gray-400 border-r border-gray-200 bg-gray-50 h-full flex items-center py-2 select-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 bg-transparent outline-none"
      />
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all resize-none bg-white"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm text-[#2D2D2D] border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white appearance-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "saving"}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        state === "saved"
          ? "bg-green-50 text-green-700 border border-green-200"
          : state === "error"
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-[#2D2D2D] text-white hover:bg-black disabled:opacity-50"
      }`}
    >
      {state === "saving" && <Loader2 size={14} className="animate-spin" />}
      {state === "saved" && <Check size={14} />}
      {state === "error" && <AlertTriangle size={14} />}
      {state === "idle" && <Save size={14} />}
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Error" : "Save changes"}
    </button>
  );
}

// ─── Section definitions ───────────────────────────────────────────────────────

const SECTIONS = [
  { id: "identity",      label: "Store Identity",    icon: Store },
  { id: "region",        label: "Currency & Region", icon: Globe },
  { id: "shipping",      label: "Shipping",          icon: Truck },
  { id: "tax",           label: "Tax",               icon: Receipt },
  { id: "orders",        label: "Orders",            icon: ShoppingBag },
  { id: "payments",      label: "Payments",          icon: CreditCard },
  { id: "notifications", label: "Notifications",     icon: Bell },
  { id: "social",        label: "Social Media",      icon: Share2 },
  { id: "legal",         label: "Content & Legal",   icon: Receipt },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [saveStates, setSaveStates] = useState<Record<SectionId, SaveState>>(
    Object.fromEntries(SECTIONS.map((s) => [s.id, "idle"])) as Record<SectionId, SaveState>
  );

  // ── Fetch on mount ──
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Helpers ──
  const get = (key: string, fallback = "") => settings[key] ?? fallback;
  const set = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));
  const getBool = (key: string, fallback = false) =>
    settings[key] !== undefined ? settings[key] === "true" : fallback;
  const setBool = (key: string, value: boolean) => set(key, String(value));

  const handleFileUpload = async (key: string, file: File | undefined) => {
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      alert("Please upload a .txt file.");
      return;
    }

    setSaveStates((prev) => ({ ...prev, legal: "saving" }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "legal");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Store the URL in settings
      set(key, data.url);
      setSaveStates((prev) => ({ ...prev, legal: "idle" }));
    } catch (err: any) {
      alert("Upload failed: " + err.message);
      setSaveStates((prev) => ({ ...prev, legal: "error" }));
    }
  };

  const save = useCallback(
    async (sectionId: SectionId, keys: string[]) => {
      setSaveStates((prev) => ({ ...prev, [sectionId]: "saving" }));
      const body = Object.fromEntries(keys.map((k) => [k, settings[k] ?? ""]));
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        setSaveStates((prev) => ({ ...prev, [sectionId]: "saved" }));
        setTimeout(() => setSaveStates((prev) => ({ ...prev, [sectionId]: "idle" })), 2500);
      } catch {
        setSaveStates((prev) => ({ ...prev, [sectionId]: "error" }));
        setTimeout(() => setSaveStates((prev) => ({ ...prev, [sectionId]: "idle" })), 3000);
      }
    },
    [settings]
  );

  // ─── Sections ──────────────────────────────────────────────────────────────

  function renderSection() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      );
    }

    switch (activeSection) {
      // ── Store Identity ──────────────────────────────────────────────────────
      case "identity":
        return (
          <Section
            title="Store Identity"
            description="Your brand name, contact details, and physical presence."
            icon={Store}
            onSave={() =>
              save("identity", [
                "store_name",
                "store_tagline",
                "store_email",
                "store_phone",
                "store_whatsapp",
                "store_address",
              ])
            }
            saveState={saveStates.identity}
          >
            <Field label="Store Name" hint="Appears in emails, receipts, and the browser tab.">
              <Input value={get("store_name")} onChange={(v) => set("store_name", v)} placeholder="HemBox" />
            </Field>
            <Field label="Tagline" hint="A short line shown in the storefront header or hero.">
              <Input value={get("store_tagline")} onChange={(v) => set("store_tagline", v)} placeholder="Premium fashion, Zambian origin." />
            </Field>
            <Field label="Store Email" hint="Used for customer-facing communications.">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={get("store_email")}
                  onChange={(e) => set("store_email", e.target.value)}
                  placeholder="hello@hembox.com"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field label="Phone Number" hint="Shown to customers for support calls.">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={get("store_phone")}
                  onChange={(e) => set("store_phone", e.target.value)}
                  placeholder="+260 97X XXX XXX"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field label="WhatsApp Number" hint="The number customers contact you on. Include country code.">
              <div className="relative">
                <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={get("store_whatsapp")}
                  onChange={(e) => set("store_whatsapp", e.target.value)}
                  placeholder="+260 97X XXX XXX"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field label="Business Address" hint="Shown on invoices and in the store footer.">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={get("store_address")}
                  onChange={(e) => set("store_address", e.target.value)}
                  placeholder={"Plot 123, Cairo Road\nLusaka, Zambia"}
                  rows={3}
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all resize-none bg-white"
                />
              </div>
            </Field>
          </Section>
        );

      // ── Currency & Region ───────────────────────────────────────────────────
      case "region":
        return (
          <Section
            title="Currency & Region"
            description="Controls how prices and dates are displayed across the store."
            icon={Globe}
            onSave={() =>
              save("region", ["store_currency", "store_currency_symbol", "store_country", "store_timezone"])
            }
            saveState={saveStates.region}
          >
            <Field label="Currency Code" hint="ISO 4217 code, e.g. ZMW, USD.">
              <Select
                value={get("store_currency", "ZMW")}
                onChange={(v) => set("store_currency", v)}
                options={[
                  { value: "ZMW", label: "ZMW — Zambian Kwacha" },
                  { value: "USD", label: "USD — US Dollar" },
                  { value: "ZAR", label: "ZAR — South African Rand" },
                  { value: "KES", label: "KES — Kenyan Shilling" },
                  { value: "GBP", label: "GBP — British Pound" },
                ]}
              />
            </Field>
            <Field label="Currency Symbol" hint="Displayed before prices in the storefront.">
              <Input value={get("store_currency_symbol", "K")} onChange={(v) => set("store_currency_symbol", v)} placeholder="K" />
            </Field>
            <Field label="Country" hint="Used for address forms and shipping logic.">
              <Input value={get("store_country", "Zambia")} onChange={(v) => set("store_country", v)} placeholder="Zambia" />
            </Field>
            <Field label="Timezone" hint="Used for order timestamps in the admin.">
              <Select
                value={get("store_timezone", "Africa/Lusaka")}
                onChange={(v) => set("store_timezone", v)}
                options={[
                  { value: "Africa/Lusaka", label: "Africa/Lusaka (CAT, UTC+2)" },
                  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST, UTC+2)" },
                  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT, UTC+3)" },
                  { value: "UTC", label: "UTC" },
                ]}
              />
            </Field>
          </Section>
        );

      // ── Shipping ────────────────────────────────────────────────────────────
      case "shipping":
        return (
          <Section
            title="Shipping"
            description="Default shipping costs and delivery timeframes."
            icon={Truck}
            onSave={() =>
              save("shipping", [
                "estimated_delivery_days",
              ])
            }
            saveState={saveStates.shipping}
          >
            <Field label="Estimated Delivery" hint="Shown to customers during checkout.">
              <Input
                value={get("estimated_delivery_days", "2–5 business days")}
                onChange={(v) => set("estimated_delivery_days", v)}
                placeholder="2–5 business days"
              />
            </Field>
          </Section>
        );

      // ── Tax ─────────────────────────────────────────────────────────────────
      case "tax":
        return (
          <Section
            title="Tax"
            description="Tax rate and how prices are displayed in the storefront."
            icon={Receipt}
            onSave={() => save("tax", ["tax_rate", "tax_included_in_price"])}
            saveState={saveStates.tax}
          >
            <Field label="Tax Rate" hint="Enter as a percentage, e.g. 16 for 16% VAT.">
              <Input
                value={get("tax_rate", "0")}
                onChange={(v) => set("tax_rate", v)}
                type="number"
                prefix="%"
                placeholder="0"
              />
            </Field>
            <Field label="Tax Included in Prices" hint="If on, displayed prices are treated as tax-inclusive.">
              <div className="flex items-center gap-3 pt-1">
                <Toggle
                  value={getBool("tax_included_in_price")}
                  onChange={(v) => setBool("tax_included_in_price", v)}
                />
                <span className="text-sm text-gray-500">
                  {getBool("tax_included_in_price") ? "Prices include tax" : "Tax added at checkout"}
                </span>
              </div>
            </Field>
          </Section>
        );

      // ── Orders ──────────────────────────────────────────────────────────────
      case "orders":
        return (
          <Section
            title="Orders"
            description="Controls how orders are numbered and who can place them."
            icon={ShoppingBag}
            onSave={() =>
              save("orders", ["order_number_prefix", "guest_checkout_enabled", "min_order_amount"])
            }
            saveState={saveStates.orders}
          >
            <Field
              label="Order Number Prefix"
              hint="Prepended to every order number. E.g. HMB- produces HMB-0001."
            >
              <Input
                value={get("order_number_prefix", "HMB-")}
                onChange={(v) => set("order_number_prefix", v)}
                placeholder="HMB-"
              />
            </Field>
            <Field label="Guest Checkout" hint="Allow customers to place orders without creating an account.">
              <div className="flex items-center gap-3 pt-1">
                <Toggle
                  value={getBool("guest_checkout_enabled", true)}
                  onChange={(v) => setBool("guest_checkout_enabled", v)}
                />
                <span className="text-sm text-gray-500">
                  {getBool("guest_checkout_enabled", true) ? "Guests can checkout" : "Account required"}
                </span>
              </div>
            </Field>
            <Field label="Minimum Order Amount" hint="Orders below this value cannot be placed. Set to 0 to disable.">
              <Input
                value={get("min_order_amount", "0")}
                onChange={(v) => set("min_order_amount", v)}
                type="number"
                prefix={get("store_currency_symbol", "K")}
                placeholder="0"
              />
            </Field>
          </Section>
        );

      // ── Payments ────────────────────────────────────────────────────────────
      case "payments": {
        const methods = ["mtn_momo", "airtel_money", "bank_transfer", "cash_on_delivery"];
        const methodLabels: Record<string, { label: string; hint: string }> = {
          mtn_momo:         { label: "MTN MoMo",          hint: "MTN Mobile Money" },
          airtel_money:     { label: "Airtel Money",      hint: "Airtel Mobile Money" },
          bank_transfer:    { label: "Bank Transfer",     hint: "Direct bank deposit" },
          cash_on_delivery: { label: "Cash on Delivery",  hint: "Pay upon receipt" },
        };
        return (
          <Section
            title="Payments"
            description="Configure how customers pay and what instructions they receive."
            icon={CreditCard}
            onSave={() =>
              save("payments", [
                "payment_whatsapp_number",
                "payment_instructions",
                ...methods.map((m) => `payment_method_${m}`),
              ])
            }
            saveState={saveStates.payments}
          >
            <Field
              label="Payment WhatsApp"
              hint="The number your team uses to contact customers about payment."
            >
              <div className="relative">
                <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={get("payment_whatsapp_number")}
                  onChange={(e) => set("payment_whatsapp_number", e.target.value)}
                  placeholder="+260 97X XXX XXX"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field
              label="Payment Instructions"
              hint="Shown at order confirmation. Tell customers what to expect."
            >
              <Textarea
                value={get(
                  "payment_instructions",
                  "Our team will contact you on WhatsApp within 24 hours to arrange payment. Your order will be confirmed once payment is received."
                )}
                onChange={(v) => set("payment_instructions", v)}
                rows={4}
                placeholder="Our team will contact you on WhatsApp…"
              />
            </Field>
            <Field label="Accepted Payment Methods" hint="Check all methods you currently accept.">
              <div className="space-y-3 pt-1">
                {methods.map((method) => (
                  <label key={method} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() =>
                        setBool(`payment_method_${method}`, !getBool(`payment_method_${method}`))
                      }
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                        getBool(`payment_method_${method}`)
                          ? "bg-[#2D2D2D] border-[#2D2D2D]"
                          : "border-gray-300 group-hover:border-gray-400"
                      }`}
                    >
                      {getBool(`payment_method_${method}`) && (
                        <Check size={10} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">{methodLabels[method].label}</p>
                      <p className="text-xs text-gray-400">{methodLabels[method].hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
          </Section>
        );
      }

      // ── Notifications ───────────────────────────────────────────────────────
      case "notifications":
        return (
          <Section
            title="Notifications"
            description="Control which events trigger admin email alerts."
            icon={Bell}
            onSave={() =>
              save("notifications", [
                "admin_notification_email",
                "notify_new_order",
                "notify_low_stock",
                "low_stock_threshold",
              ])
            }
            saveState={saveStates.notifications}
          >
            <Field
              label="Admin Alert Email"
              hint="Where order and stock notifications are sent. Overrides the ADMIN_EMAIL env variable."
            >
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={get("admin_notification_email")}
                  onChange={(e) => set("admin_notification_email", e.target.value)}
                  placeholder="admin@hembox.com"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field label="New Order Alerts" hint="Send an email when a new order is placed.">
              <div className="flex items-center gap-3 pt-1">
                <Toggle
                  value={getBool("notify_new_order", true)}
                  onChange={(v) => setBool("notify_new_order", v)}
                />
                <span className="text-sm text-gray-500">
                  {getBool("notify_new_order", true) ? "Email sent on each new order" : "Disabled"}
                </span>
              </div>
            </Field>
            <Field label="Low Stock Alerts" hint="Send an email when a variant's inventory falls below the threshold.">
              <div className="flex items-center gap-3 pt-1">
                <Toggle
                  value={getBool("notify_low_stock", true)}
                  onChange={(v) => setBool("notify_low_stock", v)}
                />
                <span className="text-sm text-gray-500">
                  {getBool("notify_low_stock", true) ? "Alerts enabled" : "Disabled"}
                </span>
              </div>
            </Field>
            {getBool("notify_low_stock", true) && (
              <Field label="Low Stock Threshold" hint="Alert fires when inventory drops to or below this number.">
                <Input
                  value={get("low_stock_threshold", "5")}
                  onChange={(v) => set("low_stock_threshold", v)}
                  type="number"
                  placeholder="5"
                />
              </Field>
            )}
          </Section>
        );

      // ── Social Media ────────────────────────────────────────────────────────
      case "social":
        return (
          <Section
            title="Social Media"
            description="Links displayed in the storefront footer and used for social sharing."
            icon={Share2}
            onSave={() =>
              save("social", [
                "social_instagram",
                "social_facebook",
                "social_tiktok",
                "social_whatsapp",
              ])
            }
            saveState={saveStates.social}
          >
            <Field label="Instagram" hint="Your handle or full profile URL.">
              <div className="relative">
                <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={get("social_instagram")}
                  onChange={(e) => set("social_instagram", e.target.value)}
                  placeholder="https://instagram.com/hembox"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field label="Facebook">
              <div className="relative">
                <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={get("social_facebook")}
                  onChange={(e) => set("social_facebook", e.target.value)}
                  placeholder="https://facebook.com/hembox"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
            <Field label="TikTok">
              <Input
                value={get("social_tiktok")}
                onChange={(v) => set("social_tiktok", v)}
                prefix="@"
                placeholder="hembox"
              />
            </Field>
            <Field label="WhatsApp Business" hint="Full number with country code, used to generate a wa.me link.">
              <div className="relative">
                <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={get("social_whatsapp")}
                  onChange={(e) => set("social_whatsapp", e.target.value)}
                  placeholder="+260 97X XXX XXX"
                  className="w-full pl-8 pr-3 py-2 text-sm text-[#2D2D2D] placeholder-gray-300 border border-gray-200 rounded-md focus:border-[#2D2D2D] focus:ring-1 focus:ring-[#2D2D2D] outline-none transition-all bg-white"
                />
              </div>
            </Field>
          </Section>
        );

      // ── Content & Legal ─────────────────────────────────────────────────────
      case "legal":
        return (
          <Section
            title="Content & Legal"
            description="Manage your store's legal pages and content via .txt file uploads."
            icon={Receipt}
            onSave={() => save("legal", ["about_us", "privacy_policy", "terms_conditions"])}
            saveState={saveStates.legal}
          >
            <Field
              label="About Us"
              hint="Upload a .txt file. The URL will be saved."
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Input value={get("about_us")} onChange={(v) => set("about_us", v)} placeholder="URL will appear here..." />
                  <label className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer hover:bg-gray-200 transition-all">
                    <Upload size={12} />
                    Upload .txt
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload("about_us", e.target.files?.[0])}
                    />
                  </label>
                </div>
                {get("about_us") && <p className="text-[10px] text-green-600 font-medium">File uploaded successfully.</p>}
              </div>
            </Field>

            <Field
              label="Privacy Policy"
              hint="Upload your privacy policy as a .txt file."
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Input value={get("privacy_policy")} onChange={(v) => set("privacy_policy", v)} placeholder="URL will appear here..." />
                  <label className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer hover:bg-gray-200 transition-all">
                    <Upload size={12} />
                    Upload .txt
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload("privacy_policy", e.target.files?.[0])}
                    />
                  </label>
                </div>
                {get("privacy_policy") && <p className="text-[10px] text-green-600 font-medium">File uploaded successfully.</p>}
              </div>
            </Field>

            <Field
              label="Terms & Conditions"
              hint="Upload your terms and conditions as a .txt file."
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Input value={get("terms_conditions")} onChange={(v) => set("terms_conditions", v)} placeholder="URL will appear here..." />
                  <label className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer hover:bg-gray-200 transition-all">
                    <Upload size={12} />
                    Upload .txt
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload("terms_conditions", e.target.files?.[0])}
                    />
                  </label>
                </div>
                {get("terms_conditions") && <p className="text-[10px] text-green-600 font-medium">File uploaded successfully.</p>}
              </div>
            </Field>
          </Section>
        );

      default:
        return null;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your store configuration</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar nav */}
        <nav className="w-52 flex-shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-6">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-0 ${
                  isActive
                    ? "bg-[#2D2D2D] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} className={isActive ? "text-white/70" : "text-gray-400"} />
                  <span className="font-medium">{section.label}</span>
                </div>
                {isActive && <ChevronRight size={12} className="text-white/50" />}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{renderSection()}</div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  icon: Icon,
  children,
  onSave,
  saveState,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onSave: () => void;
  saveState: SaveState;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-md">
          <Icon size={15} className="text-[#2D2D2D]" />
        </div>
        <div>
          <h2 className="font-semibold text-[#2D2D2D] text-sm">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="px-6 divide-y divide-gray-100">{children}</div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
        <SaveButton state={saveState} onClick={onSave} />
      </div>
    </div>
  );
}