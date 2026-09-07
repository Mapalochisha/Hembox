"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const TABS = ["Couriers", "Locations", "Zones", "Tiers", "Rates"] as const;
type Tab = (typeof TABS)[number];

interface Courier {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  _count?: { zones: number; tiers: number; shipments: number };
}
interface Location {
  id: string;
  countryCode: string;
  province: string;
  town: string;
  isActive: boolean;
  _count?: { zoneAssignments: number };
}
interface Zone {
  id: string;
  courierId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  courier: { id: string; code: string; name: string };
  _count?: { locations: number; rates: number; shipments: number };
}
interface Tier {
  id: string;
  courierId: string;
  code: string;
  name: string;
  minPoints: number | null;
  maxPoints: number | null;
  isCustom: boolean;
  isActive: boolean;
  position: number;
  courier: { id: string; code: string; name: string };
  _count?: { rates: number; shipments: number };
}
interface Rate {
  id: string;
  deliveryZoneId: string;
  packageTierId: string;
  courierCost: string | number;
  customerPriceStrategy: string;
  customerPriceValue: string | number | null;
  currencyCode: string;
  isActive: boolean;
  deliveryZone: {
    id: string;
    code: string;
    name: string;
    courier: { id: string; code: string; name: string };
  };
  packageTier: {
    id: string;
    code: string;
    name: string;
    minPoints: number | null;
    maxPoints: number | null;
    isCustom: boolean;
  };
}

const STRATEGIES = [
  "MATCH_COURIER_COST",
  "FIXED_AMOUNT",
  "MARKUP_AMOUNT",
  "MARKUP_PERCENT",
  "SUBSIDY_AMOUNT",
  "FREE",
];

function formatStrategy(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
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
    setLoading(true);
    setError(null);
    try {
      const [c, l, z, t, r] = await Promise.all([
        requestJson("/api/admin/shipping/couriers"),
        requestJson("/api/admin/shipping/locations"),
        requestJson("/api/admin/shipping/zones"),
        requestJson("/api/admin/shipping/tiers"),
        requestJson("/api/admin/shipping/rates"),
      ]);
      setCouriers(c);
      setLocations(l);
      setZones(z);
      setTiers(t);
      setRates(r);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeCouriers = useMemo(() => couriers.filter((c) => c.isActive), [couriers]);
  const activeZones = useMemo(() => zones.filter((z) => z.isActive), [zones]);
  const activeTiers = useMemo(() => tiers.filter((t) => t.isActive), [tiers]);

  async function submit(url: string, method: string, body: unknown) {
    setSaving(true);
    setError(null);
    try {
      await requestJson(url, { method, body: JSON.stringify(body) });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function createCourier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/couriers", "POST", {
      code: f.get("code"),
      name: f.get("name"),
    });
    e.currentTarget.reset();
  }

  async function createLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/locations", "POST", {
      countryCode: f.get("countryCode"),
      province: f.get("province"),
      town: f.get("town"),
    });
    e.currentTarget.reset();
  }

  async function createZone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/zones", "POST", {
      courierId: f.get("courierId"),
      code: f.get("code"),
      name: f.get("name"),
      description: f.get("description"),
    });
    e.currentTarget.reset();
  }

  async function createTier(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await submit("/api/admin/shipping/tiers", "POST", {
      courierId: f.get("courierId"),
      code: f.get("code"),
      name: f.get("name"),
      minPoints: f.get("minPoints"),
      maxPoints: f.get("maxPoints"),
      isCustom: f.get("isCustom") === "on",
      position: f.get("position"),
    });
    e.currentTarget.reset();
  }

  async function createRate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const strategy = String(f.get("customerPriceStrategy"));
    await submit("/api/admin/shipping/rates", "POST", {
      deliveryZoneId: f.get("deliveryZoneId"),
      packageTierId: f.get("packageTierId"),
      courierCost: f.get("courierCost"),
      customerPriceStrategy: strategy,
      customerPriceValue:
        strategy === "FREE" || strategy === "MATCH_COURIER_COST"
          ? null
          : f.get("customerPriceValue"),
      currencyCode: f.get("currencyCode"),
    });
    e.currentTarget.reset();
  }

  const tabCounts = {
    Couriers: couriers.length,
    Locations: locations.length,
    Zones: zones.length,
    Tiers: tiers.length,
    Rates: rates.length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <header className="flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Shipping</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">Shipping Configuration</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Configure couriers, delivery destinations, package tiers and customer-facing shipping rates.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex w-fit items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          ← Back to dashboard
        </Link>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800 shadow-sm">
          <p className="font-semibold">Could not save the change</p>
          <p className="mt-0.5 text-red-700">{error}</p>
        </div>
      )}

      <nav aria-label="Shipping configuration sections" className="overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max gap-1">
          {TABS.map((item) => {
            const selected = tab === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                aria-current={selected ? "page" : undefined}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900/20 ${
                  selected
                    ? "text-gray-950"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item}
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {tabCounts[item]}
                </span>
                {selected && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gray-900" />}
              </button>
            );
          })}
        </div>
      </nav>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Loading shipping configuration…
        </div>
      ) : (
        <>
          {tab === "Couriers" && (
            <section className="space-y-5">
              <CreateCard title="Add courier" description="Create a courier that can own zones, package tiers and rates." onSubmit={createCourier} saving={saving}>
                <Field name="code" label="Code" placeholder="DHL" />
                <Field name="name" label="Name" placeholder="DHL Express" />
              </CreateCard>
              <Table headers={["Code", "Name", "Zones", "Tiers", "Shipments", "Status", ""]} empty="No couriers configured yet.">
                {couriers.map((c) => (
                  <tr key={c.id}>
                    <Cell emphasis>{c.code}</Cell>
                    <Cell>{c.name}</Cell>
                    <Cell>{c._count?.zones ?? 0}</Cell>
                    <Cell>{c._count?.tiers ?? 0}</Cell>
                    <Cell>{c._count?.shipments ?? 0}</Cell>
                    <Cell><Status active={c.isActive} /></Cell>
                    <ActionCell>
                      <ToggleButton active={c.isActive} disabled={saving} onClick={() => void submit(`/api/admin/shipping/couriers/${c.id}`, "PATCH", { isActive: !c.isActive })} />
                    </ActionCell>
                  </tr>
                ))}
              </Table>
            </section>
          )}

          {tab === "Locations" && (
            <section className="space-y-5">
              <CreateCard title="Add delivery location" description="Define a town and province that can be assigned to courier zones." onSubmit={createLocation} saving={saving}>
                <Field name="countryCode" label="Country code" placeholder="ZM" hint="ISO-style two-letter code" />
                <Field name="province" label="Province" placeholder="Copperbelt" />
                <Field name="town" label="Town" placeholder="Kitwe" />
              </CreateCard>
              <Table headers={["Country", "Province", "Town", "Zone assignments", "Status", ""]} empty="No delivery locations configured yet.">
                {locations.map((l) => (
                  <tr key={l.id}>
                    <Cell emphasis>{l.countryCode}</Cell>
                    <Cell>{l.province}</Cell>
                    <Cell>{l.town}</Cell>
                    <Cell>{l._count?.zoneAssignments ?? 0}</Cell>
                    <Cell><Status active={l.isActive} /></Cell>
                    <ActionCell>
                      <ToggleButton active={l.isActive} disabled={saving} onClick={() => void submit(`/api/admin/shipping/locations/${l.id}`, "PATCH", { isActive: !l.isActive })} />
                    </ActionCell>
                  </tr>
                ))}
              </Table>
            </section>
          )}

          {tab === "Zones" && (
            <section className="space-y-5">
              <CreateCard title="Add delivery zone" description="A zone groups delivery locations for a specific courier." onSubmit={createZone} saving={saving}>
                <Select name="courierId" label="Courier" options={activeCouriers.map((c) => [c.id, `${c.name} (${c.code})`])} />
                <Field name="code" label="Zone code" placeholder="LUSAKA" />
                <Field name="name" label="Zone name" placeholder="Lusaka" />
                <Field name="description" label="Description" placeholder="Optional description" required={false} />
                <p className="lg:col-span-3 text-xs leading-5 text-gray-500">After creating a zone, open its details to assign active delivery locations.</p>
              </CreateCard>
              <Table headers={["Courier", "Code", "Name", "Locations", "Rates", "Status", ""]} empty="No delivery zones configured yet.">
                {zones.map((z) => (
                  <tr key={z.id}>
                    <Cell>{z.courier.name}</Cell>
                    <Cell emphasis>{z.code}</Cell>
                    <Cell>
                      <Link href={`/admin/shipping/zones/${z.id}`} className="font-semibold text-gray-950 underline-offset-4 hover:underline">
                        {z.name}
                      </Link>
                    </Cell>
                    <Cell>{z._count?.locations ?? 0}</Cell>
                    <Cell>{z._count?.rates ?? 0}</Cell>
                    <Cell><Status active={z.isActive} /></Cell>
                    <ActionCell>
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/shipping/zones/${z.id}`} className="rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-900/20">
                          Details
                        </Link>
                        <ToggleButton active={z.isActive} disabled={saving} onClick={() => void submit(`/api/admin/shipping/zones/${z.id}`, "PATCH", { isActive: !z.isActive })} />
                      </div>
                    </ActionCell>
                  </tr>
                ))}
              </Table>
            </section>
          )}

          {tab === "Tiers" && (
            <section className="space-y-5">
              <CreateCard title="Add package tier" description="Define the point range used by the shipping engine. Point values are whole numbers." onSubmit={createTier} saving={saving}>
                <Select name="courierId" label="Courier" options={activeCouriers.map((c) => [c.id, `${c.name} (${c.code})`])} />
                <Field name="code" label="Tier code" placeholder="1_2_POINTS" />
                <Field name="name" label="Tier name" placeholder="1–2 points" />
                <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                  <Field name="minPoints" label="Minimum points" placeholder="1" type="number" inputMode="numeric" step="1" min="0" hint="Whole numbers only" />
                  <Field name="maxPoints" label="Maximum points" placeholder="2" type="number" inputMode="numeric" step="1" min="0" required={false} hint="Leave blank for no upper limit" />
                </div>
                <Field name="position" label="Display position" placeholder="0" type="number" inputMode="numeric" step="1" min="0" hint="Lower numbers appear first" />
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 lg:col-span-2">
                  <input type="checkbox" name="isCustom" id="isCustom" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span><span className="font-semibold text-gray-900">Custom tier</span><span className="block text-xs leading-5 text-gray-500">Use this for orders that exceed normal configured point ranges.</span></span>
                </label>
              </CreateCard>
              <Table headers={["Courier", "Code", "Point range", "Custom", "Rates", "Status", ""]} empty="No package tiers configured yet.">
                {tiers.map((t) => (
                  <tr key={t.id}>
                    <Cell>{t.courier.name}</Cell>
                    <Cell emphasis>{t.code}</Cell>
                    <Cell><span className="font-semibold text-gray-900">{t.minPoints ?? "∞"} – {t.maxPoints ?? "∞"}</span> <span className="text-xs text-gray-500">points</span></Cell>
                    <Cell>{t.isCustom ? <span className="font-medium text-gray-700">Yes</span> : "No"}</Cell>
                    <Cell>{t._count?.rates ?? 0}</Cell>
                    <Cell><Status active={t.isActive} /></Cell>
                    <ActionCell>
                      <ToggleButton active={t.isActive} disabled={saving} onClick={() => void submit(`/api/admin/shipping/tiers/${t.id}`, "PATCH", { isActive: !t.isActive })} />
                    </ActionCell>
                  </tr>
                ))}
              </Table>
            </section>
          )}

          {tab === "Rates" && (
            <section className="space-y-5">
              <CreateCard title="Add shipping rate" description="Set the courier cost and the price customers will pay for a zone and package tier." onSubmit={createRate} saving={saving}>
                <Select name="deliveryZoneId" label="Delivery zone" options={activeZones.map((z) => [z.id, `${z.courier.name} → ${z.name}`])} />
                <Select name="packageTierId" label="Package tier" options={activeTiers.map((t) => [t.id, `${t.courier.name} → ${t.name}`])} />
                <Field name="courierCost" label="Courier cost" placeholder="50.00" type="number" inputMode="decimal" step="0.01" min="0" hint="ZMW" />
                <Field name="currencyCode" label="Currency" placeholder="ZMW" defaultValue="ZMW" />
                <Select name="customerPriceStrategy" label="Customer pricing strategy" options={STRATEGIES.map((s) => [s, formatStrategy(s)])} />
                <Field name="customerPriceValue" label="Pricing value" placeholder="75.00" type="number" inputMode="decimal" step="0.01" min="0" required={false} hint="Not used for Free or Match Courier Cost" />
                <p className="lg:col-span-3 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-5 text-gray-600">Zone and package tier must belong to the same courier. Pricing values use two decimal places.</p>
              </CreateCard>
              <Table headers={["Courier", "Zone", "Tier", "Courier cost", "Customer pricing", "Status", ""]} empty="No shipping rates configured yet.">
                {rates.map((r) => (
                  <tr key={r.id}>
                    <Cell>{r.deliveryZone.courier.name}</Cell>
                    <Cell emphasis>{r.deliveryZone.name}</Cell>
                    <Cell>{r.packageTier.name}</Cell>
                    <Cell><span className="font-semibold text-gray-900">{r.currencyCode} {Number(r.courierCost).toFixed(2)}</span></Cell>
                    <Cell><span className="font-medium text-gray-800">{formatStrategy(r.customerPriceStrategy)}</span>{r.customerPriceValue !== null ? <span className="ml-1 text-gray-500">({Number(r.customerPriceValue).toFixed(2)})</span> : null}</Cell>
                    <Cell><Status active={r.isActive} /></Cell>
                    <ActionCell>
                      <ToggleButton active={r.isActive} disabled={saving} onClick={() => void submit(`/api/admin/shipping/rates/${r.id}`, "PATCH", { isActive: !r.isActive })} />
                    </ActionCell>
                  </tr>
                ))}
              </Table>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function CreateCard({
  title,
  description,
  onSubmit,
  saving,
  children,
}: {
  title: string;
  description: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">{children}</div>
      <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
        <p className="text-xs text-gray-500">Changes are validated on the server.</p>
        <button type="submit" disabled={saving} className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/30 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  defaultValue,
  required = true,
  min,
  step,
  inputMode,
  hint,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: string;
  step?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  hint?: string;
}) {
  return (
    <label className="block text-sm text-gray-700">
      <span className="font-semibold text-gray-800">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        min={min}
        step={step}
        inputMode={inputMode}
        className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
      />
      {hint && <span className="mt-1 block text-xs leading-4 text-gray-500">{hint}</span>}
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[][] }) {
  return (
    <label className="block text-sm text-gray-700">
      <span className="font-semibold text-gray-800">{label}</span>
      <select name={name} required className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-950 shadow-sm outline-none transition hover:border-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10">
        <option value="">Select…</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      {options.length === 0 && <span className="mt-1 block text-xs text-amber-600">No active options available. Create and activate one first.</span>}
    </label>
  );
}

function Table({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
            <tr>{headers.map((h, i) => <th key={`${h}-${i}`} className="px-4 py-3.5 font-bold first:pl-5 last:pr-5">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {children || <tr><td colSpan={headers.length} className="px-5 py-12 text-center text-sm text-gray-500">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ children, emphasis = false }: { children: React.ReactNode; emphasis?: boolean }) {
  return <td className={`whitespace-nowrap px-4 py-3.5 text-gray-700 first:pl-5 last:pr-5 ${emphasis ? "font-semibold text-gray-950" : ""}`}>{children}</td>;
}

function ActionCell({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3.5 text-right first:pl-5 last:pr-5">{children}</td>;
}

function ToggleButton({ active, disabled, onClick }: { active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:cursor-not-allowed disabled:opacity-50 ${active ? "text-gray-600 hover:bg-red-50 hover:text-red-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}

function Status({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
