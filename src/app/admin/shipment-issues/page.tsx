"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TYPES = ["DELAYED", "LOST", "DAMAGED", "WRONG_ITEM", "ADDRESS_PROBLEM", "COURIER_PROBLEM", "CUSTOMER_UNAVAILABLE", "OTHER"] as const;
const RESPONSIBILITIES = ["UNASSIGNED", "COURIER", "STORE", "CUSTOMER", "THIRD_PARTY"] as const;
const STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] as const;

type Issue = {
  id: string; shipmentId: string; type: string; description: string; responsibility: string; status: string;
  resolution: string | null; createdByEmail: string | null; resolvedByEmail: string | null;
  createdAt: string; updatedAt: string; resolvedAt: string | null; shipmentStatus: string;
  trackingNumber: string | null; orderNumber: string; events?: Event[];
};
type Event = { id: string; adminEmail: string | null; fromStatus: string | null; toStatus: string | null; responsibility: string | null; note: string | null; resolution: string | null; createdAt: string };

function label(value: string) { return value.toLowerCase().split("_").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" "); }
function date(value: string) { return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function ShipmentIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ shipmentId: "", type: "DELAYED", description: "", responsibility: "UNASSIGNED", note: "" });
  const [edit, setEdit] = useState({ status: "", responsibility: "", resolution: "", note: "" });

  async function load() {
    setLoading(true); setError("");
    try { const r = await fetch("/api/admin/shipment-issues", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load issues"); setIssues(Array.isArray(d) ? d : []); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load issues"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/shipment-issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to create issue");
      setForm({ shipmentId: "", type: "DELAYED", description: "", responsibility: "UNASSIGNED", note: "" }); await load(); setSelected(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create issue"); }
    finally { setSaving(false); }
  }

  async function openIssue(issue: Issue) {
    try { const r = await fetch(`/api/admin/shipment-issues/${issue.id}`, { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setSelected(d); setEdit({ status: d.status, responsibility: d.responsibility, resolution: d.resolution ?? "", note: "" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load issue"); }
  }

  async function saveIssue() {
    if (!selected) return; setSaving(true); setError("");
    try {
      const r = await fetch(`/api/admin/shipment-issues/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to update issue"); setSelected(d); setEdit({ status: d.status, responsibility: d.responsibility, resolution: d.resolution ?? "", note: "" }); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update issue"); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold text-[#2D2D2D]">Delivery Issues</h1><p className="mt-1 text-sm text-gray-500">Record failures, investigate responsibility, document resolution, and preserve an accountability history.</p></div><Link href="/admin/shipments" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">Shipments</Link></div>

    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-[#2D2D2D]">Report an issue</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input value={form.shipmentId} onChange={e => setForm({ ...form, shipmentId: e.target.value })} placeholder="Shipment ID" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">{TYPES.map(v => <option key={v}>{v}</option>)}</select>
        <select value={form.responsibility} onChange={e => setForm({ ...form, responsibility: e.target.value })} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">{RESPONSIBILITIES.map(v => <option key={v}>{v}</option>)}</select>
        <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Initial investigation note (optional)" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe exactly what happened..." rows={3} className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2" />
      </div>
      <button disabled={saving || !form.shipmentId.trim() || !form.description.trim()} onClick={() => void create()} className="mt-3 rounded-lg bg-[#2D2D2D] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : "Create issue"}</button>
    </section>

    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4 font-semibold">Issue register ({issues.length})</div>
      {loading ? <div className="p-6 text-sm text-gray-500">Loading issues...</div> : issues.length === 0 ? <div className="p-6 text-sm text-gray-500">No delivery issues recorded.</div> : <div className="divide-y divide-gray-100">{issues.map(issue => <button key={issue.id} onClick={() => void openIssue(issue)} className="grid w-full gap-2 px-5 py-4 text-left hover:bg-gray-50 md:grid-cols-[1.3fr_1fr_1fr_1.5fr] md:items-center"><div><div className="font-medium text-gray-900">{label(issue.type)}</div><div className="text-xs text-gray-500">Order {issue.orderNumber} · {date(issue.createdAt)}</div></div><span className="text-sm text-gray-600">{label(issue.responsibility)}</span><span className="text-sm font-medium">{label(issue.status)}</span><div className="truncate text-sm text-gray-600">{issue.description}</div></button>)}</div>}
    </section>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{label(selected.type)}</h2><p className="text-sm text-gray-500">Order {selected.orderNumber} · Shipment {selected.shipmentId}</p></div><button onClick={() => setSelected(null)} className="text-sm text-gray-500">Close</button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div><label className="text-xs font-medium text-gray-500">Status</label><select value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm">{STATUSES.map(v => <option key={v}>{v}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-500">Responsibility</label><select value={edit.responsibility} onChange={e => setEdit({ ...edit, responsibility: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm">{RESPONSIBILITIES.map(v => <option key={v}>{v}</option>)}</select></div>
          <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500">Description</label><p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{selected.description}</p></div>
          <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500">Resolution</label><textarea value={edit.resolution} onChange={e => setEdit({ ...edit, resolution: e.target.value })} rows={3} placeholder="What was done to resolve this issue?" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div className="md:col-span-2"><label className="text-xs font-medium text-gray-500">Investigation / accountability note</label><textarea value={edit.note} onChange={e => setEdit({ ...edit, note: e.target.value })} rows={2} placeholder="Record evidence, contact with courier/customer, or next action..." className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
        </div>
        <button disabled={saving} onClick={() => void saveIssue()} className="mt-4 rounded-lg bg-[#2D2D2D] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : "Save investigation"}</button>
        <div className="mt-7"><h3 className="font-semibold">History</h3><div className="mt-3 space-y-3">{(selected.events ?? []).map(event => <div key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{event.fromStatus ? `${label(event.fromStatus)} → ` : ""}{label(event.toStatus ?? "Update")}</span><span className="text-xs text-gray-500">{date(event.createdAt)}</span></div>{event.adminEmail && <div className="mt-1 text-xs text-gray-500">By {event.adminEmail}</div>}{event.note && <p className="mt-2 text-gray-700">{event.note}</p>}{event.resolution && <p className="mt-2 text-gray-700">Resolution: {event.resolution}</p>}</div>)}</div></div>
      </div>
    </div>}
  </div>;
}
