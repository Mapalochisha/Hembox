"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Location { id: string; countryCode: string; province: string; town: string; isActive: boolean }
interface ZoneLocation { location: Location }
interface Zone { id: string; code: string; name: string; description: string | null; courier: { name: string; code: string }; locations: ZoneLocation[] }

export default function ShippingZoneDetailPage({ params }: { params: { id: string } }) {
  const [zone, setZone] = useState<Zone | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [zoneResponse, locationsResponse] = await Promise.all([
          fetch(`/api/admin/shipping/zones/${params.id}`),
          fetch("/api/admin/shipping/locations"),
        ]);
        const zoneBody = await zoneResponse.json();
        const locationsBody = await locationsResponse.json();
        if (!zoneResponse.ok) throw new Error(zoneBody.error || "Failed to load zone.");
        if (!locationsResponse.ok) throw new Error(locationsBody.error || "Failed to load locations.");
        setZone(zoneBody);
        setLocations(locationsBody.filter((location: Location) => location.isActive));
        setSelected(zoneBody.locations.map((item: ZoneLocation) => item.location.id));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load zone.");
      } finally { setLoading(false); }
    })();
  }, [params.id]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function save() {
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(`/api/admin/shipping/zones/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationIds: selected }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to save assignments.");
      setMessage("Zone locations saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save assignments.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading zone…</div>;
  if (!zone) return <div className="p-8"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message || "Zone not found."}</div></div>;

  return <div className="max-w-4xl space-y-6">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-gray-500">{zone.courier.name} · {zone.courier.code}</p><h1 className="text-3xl font-bold text-gray-900 mt-1">{zone.name}</h1><p className="text-sm text-gray-500 mt-1">{zone.code}{zone.description ? ` · ${zone.description}` : ""}</p></div>
      <Link href="/admin/shipping" className="text-sm text-gray-500 hover:text-gray-900">← Shipping configuration</Link>
    </div>
    {message && <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">{message}</div>}
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4 mb-4"><div><h2 className="font-semibold text-gray-900">Assigned delivery locations</h2><p className="text-xs text-gray-500 mt-1">Only active locations can be assigned. Saving replaces the zone&apos;s complete assignment set.</p></div><button onClick={() => void save()} disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save locations"}</button></div>
      <div className="grid gap-2 sm:grid-cols-2">
        {locations.map((location) => <label key={location.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"><input type="checkbox" checked={selected.includes(location.id)} onChange={() => toggle(location.id)} /><span><span className="block text-sm font-medium text-gray-900">{location.town}</span><span className="block text-xs text-gray-500">{location.province} · {location.countryCode}</span></span></label>)}
      </div>
      {locations.length === 0 && <p className="text-sm text-gray-500">Create active delivery locations first.</p>}
    </section>
  </div>;
}
