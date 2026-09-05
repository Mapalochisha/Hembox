"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const TABS = ["Couriers", "Locations", "Zones", "Tiers", "Rates"] as const;
type Tab = (typeof TABS)[number];

interface Courier { id: string; code: string; name: string; isActive: boolean; _count?: { zones: number; tiers: number; shipments: number } }
interface Location { id: string; countryCode: string; province: string; town: string; isActive: boolean; _count?: { zoneAssignments: number } }
interface Zone { id: string; courierId: string; code: string; name: string; description: string | null; isActive: boolean; courier: { id: string; code: string; name: string }; _count?: { locations: number; rates: number; shipments: number } }
interface Tier { id: string; courierId: string; code: string; name: string; minPoints: number | null; maxPoints: number | null; isCustom: boolean; isActive: boolean; position: number; courier: { id: string; code: string; name: string }; _count?: { rates: number; shipments: number } }
interface Rate { id: string; deliveryZoneId: string; packageTierId: string; courierCost: string | number; customerPriceStrategy: string; customerPriceValue: string | number | null; currencyCode: string; isActive: boolean; deliveryZone: { id: string; code: string; name: string; courier: { id: string; code: string; name: string } }; packageTier: { id: string; code: string; name: string; minPoints: number | null; maxPoints: number | null; isCustom: boolean } }

const STRATEGIES = ["MATCH_COURIER_COST", "FIXED_AMOUNT", "MARKUP_AMOUNT", "MARKUP_PERCENT", "SUBSIDY_AMOUNT", "FREE"];

function formatStrategy(value: string) {
  return value.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export default function ShippingConfigurationPage() {
  const [tab, setTab] = useState<Tab>("Couriers");
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [c, l, z, t, r] = await Promise.all([
        requestJson("/api/admin/shipping/couriers"),
        requestJson("/api/admin/shipping/locations"),
        requestJson("/api/admin/shipping/zones"),
        requestJson("/api/admin/shipping/tiers"),
        requestJson("/api/admin/shipping/rates"),
      ]);
      setCouriers(c); setLocations(l); setZones(z); setTiers(t); setRates(r);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const activeCouriers = useMemo(() => couriers.filter((c) => c.isActive), [couriers]);
  const activeLocations = useMemo(() => locations.filter((l) => l.isActive), [locations]);
  const activeZones = useMemo(() => zones.filter((z) => z.isActive), [zones]);
  const activeTiers = useMemo(() => tiers.filter((t) => t.isActive), [tiers]);

  async function submit(url: string, method: string, body: unknown) {
    setSaving(true); setError(null);
    try { await requestJson(url, { method, body: JSON.stringify(body) }); await load(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  }

  async function createCourier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/couriers", "POST", { code: f.get("code"), name: f.get("name") });
    e.currentTarget.reset();
  }
  async function createLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/locations", "POST", { countryCode: f.get("countryCode"), province: f.get("province"), town: f.get("town") });
    e.currentTarget.reset();
  }
  async function createZone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/zones", "POST", { courierId: f.get("courierId"), code: f.get("code"), name: f.get("name"), description: f.get("description") });
    e.currentTarget.reset();
  }
  async function createTier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/tiers", "POST", { courierId: f.get("courierId"), code: f.get("code"), name: f.get("name"), minPoints: f.get("minPoints"), maxPoints: f.get("maxPoints"), isCustom: f.get("isCustom") === "on", position: f.get("position") });
    e.currentTarget.reset();
  }
  async function createRate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); const strategy = String(f.get("customerPriceStrategy"));
    await submit("/api/admin/shipping/rates", "POST", { deliveryZoneId: f.get("deliveryZoneId"), packageTierId: f.get("packageTierId"), courierCost: f.get("courierCost"), customerPriceStrategy: strategy, customerPriceValue: strategy === "FREE" || strategy === "MATCH_COURIER_COST" ? null : f.get("customerPriceValue"), currencyCode: f.get("currencyCode") });
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Shipping</p><h1 className="text-3xl font-bold text-gray-900 mt-1">Shipping Configuration</h1><p className="text-sm text-gray-500 mt-2">Configure couriers, destinations, package tiers and customer rates used by the shipping engine.</p></div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">Back to dashboard</Link>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === item ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"}`}>{item}</button>)}
      </div>

      {loading ? <div className="rounded-xl border bg-white p-8 text-sm text-gray-500">Loading shipping configuration…</div> : (
        <>
          {tab === "Couriers" && <section className="space-y-5"><CreateCard title="Add courier" onSubmit={createCourier} saving={saving}><Field name="code" label="Code" placeholder="DHL"/><Field name="name" label="Name" placeholder="DHL Express"/></CreateCard><Table headers={["Code", "Name", "Zones", "Tiers", "Shipments", "Status", ""]}>{couriers.map((c) => <tr key={c.id}><Cell>{c.code}</Cell><Cell>{c.name}</Cell><Cell>{c._count?.zones ?? 0}</Cell><Cell>{c._count?.tiers ?? 0}</Cell><Cell>{c._count?.shipments ?? 0}</Cell><Cell><Status active={c.isActive}/></Cell><Cell><button disabled={saving} onClick={() => void submit(`/api/admin/shipping/couriers/${c.id}`, "PATCH", { isActive: !c.isActive })} className="text-sm font-medium hover:underline">{c.isActive ? "Deactivate" : "Activate"}</button></Cell></tr>)}</Table></section>}

          {tab === "Locations" && <section className="space-y-5"><CreateCard title="Add delivery location" onSubmit={createLocation} saving={saving}><Field name="countryCode" label="Country" placeholder="ZM"/><Field name="province" label="Province" placeholder="Copperbelt"/><Field name="town" label="Town" placeholder="Kitwe"/></CreateCard><Table headers={["Country", "Province", "Town", "Zone assignments", "Status", ""]}>{locations.map((l) => <tr key={l.id}><Cell>{l.countryCode}</Cell><Cell>{l.province}</Cell><Cell>{l.town}</Cell><Cell>{l._count?.zoneAssignments ?? 0}</Cell><Cell><Status active={l.isActive}/></Cell><Cell><button disabled={saving} onClick={() => void submit(`/api/admin/shipping/locations/${l.id}`, "PATCH", { isActive: !l.isActive })} className="text-sm font-medium hover:underline">{l.isActive ? "Deactivate" : "Activate"}</button></Cell></tr>)}</Table></section>}

          {tab === "Zones" && <section className="space-y-5"><CreateCard title="Add delivery zone" onSubmit={createZone} saving={saving}><Select name="courierId" label="Courier" options={activeCouriers.map((c) => [c.id, `${c.name} (${c.code})`])}/><Field name="code" label="Code" placeholder="LUSAKA"/><Field name="name" label="Name" placeholder="Lusaka"/><Field name="description" label="Description" placeholder="Optional description"/><p className="text-xs text-gray-500">After creating a zone, use its detail endpoint/API to assign active locations. Zone location assignment is deliberately atomic.</p></CreateCard><Table headers={["Courier", "Code", "Name", "Locations", "Rates", "Status", ""]}>{zones.map((z) => <tr key={z.id}><Cell>{z.courier.name}</Cell><Cell>{z.code}</Cell><Cell>{z.name}</Cell><Cell>{z._count?.locations ?? 0}</Cell><Cell>{z._count?.rates ?? 0}</Cell><Cell><Status active={z.isActive}/></Cell><Cell><button disabled={saving} onClick={() => void submit(`/api/admin/shipping/zones/${z.id}`, "PATCH", { isActive: !z.isActive })} className="text-sm font-medium hover:underline">{z.isActive ? "Deactivate" : "Activate"}</button></Cell></tr>)}</Table></section>}

          {tab === "Tiers" && <section className="space-y-5"><CreateCard title="Add package tier" onSubmit={createTier} saving={saving}><Select name="courierId" label="Courier" options={activeCouriers.map((c) => [c.id, `${c.name} (${c.code})`])}/><Field name="code" label="Code" placeholder="1_2_POINTS"/><Field name="name" label="Name" placeholder="1–2 points"/><div className="grid grid-cols-2 gap-3"><Field name="minPoints" label="Min points" placeholder="1" type="number"/><Field name="maxPoints" label="Max points" placeholder="2" type="number"/></div><div className="flex items-center gap-2"><input type="checkbox" name="isCustom" id="isCustom"/><label htmlFor="isCustom" className="text-sm text-gray-700">Custom tier</label></div><Field name="position" label="Position" placeholder="0" type="number"/></CreateCard><Table headers={["Courier", "Code", "Range", "Custom", "Rates", "Status", ""]}>{tiers.map((t) => <tr key={t.id}><Cell>{t.courier.name}</Cell><Cell>{t.code}</Cell><Cell>{t.minPoints ?? "∞"} – {t.maxPoints ?? "∞"}</Cell><Cell>{t.isCustom ? "Yes" : "No"}</Cell><Cell>{t._count?.rates ?? 0}</Cell><Cell><Status active={t.isActive}/></Cell><Cell><button disabled={saving} onClick={() => void submit(`/api/admin/shipping/tiers/${t.id}`, "PATCH", { isActive: !t.isActive })} className="text-sm font-medium hover:underline">{t.isActive ? "Deactivate" : "Activate"}</button></Cell></tr>)}</Table></section>}

          {tab === "Rates" && <section className="space-y-5"><CreateCard title="Add shipping rate" onSubmit={createRate} saving={saving}><Select name="deliveryZoneId" label="Zone" options={activeZones.map((z) => [z.id, `${z.courier.name} → ${z.name}`])}/><Select name="packageTierId" label="Package tier" options={activeTiers.map((t) => [t.id, `${t.courier.name} → ${t.name}`])}/><div className="grid grid-cols-2 gap-3"><Field name="courierCost" label="Courier cost" placeholder="50.00" type="number"/><Field name="currencyCode" label="Currency" placeholder="ZMW" defaultValue="ZMW"/></div><Select name="customerPriceStrategy" label="Customer pricing strategy" options={STRATEGIES.map((s) => [s, formatStrategy(s)])}/><Field name="customerPriceValue" label="Pricing value" placeholder="75.00" type="number"/><p className="text-xs text-gray-500">For FREE and MATCH_COURIER_COST, pricing value is ignored. Zone and tier must belong to the same courier.</p></CreateCard><Table headers={["Courier", "Zone", "Tier", "Courier cost", "Customer pricing", "Status", ""]}>{rates.map((r) => <tr key={r.id}><Cell>{r.deliveryZone.courier.name}</Cell><Cell>{r.deliveryZone.name}</Cell><Cell>{r.packageTier.name}</Cell><Cell>{r.currencyCode} {Number(r.courierCost).toFixed(2)}</Cell><Cell>{formatStrategy(r.customerPriceStrategy)}{r.customerPriceValue !== null ? ` (${r.customerPriceValue})` : ""}</Cell><Cell><Status active={r.isActive}/></Cell><Cell><button disabled={saving} onClick={() => void submit(`/api/admin/shipping/rates/${r.id}`, "PATCH", { isActive: !r.isActive })} className="text-sm font-medium hover:underline">{r.isActive ? "Deactivate" : "Activate"}</button></Cell></tr>)}</Table></section>}
        </>
      )}
    </div>
  );
}

function CreateCard({ title, onSubmit, saving, children }: { title: string; onSubmit: (e: FormEvent<HTMLFormElement>) => void; saving: boolean; children: React.ReactNode }) {
  return <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4"><div><h2 className="font-semibold text-gray-900">{title}</h2><p className="text-xs text-gray-500 mt-1">Changes are validated on the server.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div><button disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Create"}</button></form>;
}
function Field({ name, label, placeholder, type = "text", defaultValue }: { name: string; label: string; placeholder?: string; type?: string; defaultValue?: string }) { return <label className="space-y-1 text-sm text-gray-700"><span className="font-medium">{label}</span><input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={name !== "description" && name !== "position" && name !== "customerPriceValue" && name !== "maxPoints"} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900" /></label> }
function Select({ name, label, options }: { name: string; label: string; options: string[][] }) { return <label className="space-y-1 text-sm text-gray-700"><span className="font-medium">{label}</span><select name={name} required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-gray-900"><option value="">Select…</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label> }
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr>{headers.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{children}</tbody></table></div> }
function Cell({ children }: { children: React.ReactNode }) { return <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{children}</td> }
function Status({ active }: { active: boolean }) { return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{active ? "Active" : "Inactive"}</span> }
