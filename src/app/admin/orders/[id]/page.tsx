"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  notes: string | null;
  trackingNumber: string | null;
  shippingAddress: any;
  customer: { name: string | null; email: string; phone: string | null } | null;
  items: {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    priceAtPurchase: number;
    total: number;
    variantSnapshot: any;
  }[];
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setTrackingNumber(data.trackingNumber ?? "");
        setLoading(false);
      });
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paymentStatus, trackingNumber }),
    });
    setSaving(false);
    router.refresh();
  }

  if (loading) return <div className="text-sm text-gray-400 p-8">Loading order...</div>;
  if (!order) return <div className="text-sm text-gray-400 p-8">Order not found.</div>;

  const address = order.shippingAddress as any;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Order items */}
        <div className="col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">Items Ordered</h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                    {item.variantSnapshot?.attributes && Object.keys(item.variantSnapshot.attributes).length > 0 && (
                      <p className="text-xs text-gray-400">
                        {Object.entries(item.variantSnapshot.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">Qty: {item.quantity} × K {Number(item.priceAtPurchase).toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">K {Number(item.total).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>K {Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Shipping</span>
                <span>{Number(order.shippingCost) === 0 ? "Free" : `K ${Number(order.shippingCost).toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-800 pt-1">
                <span>Total</span>
                <span>K {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Update order */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">Update Order</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Order Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Payment Status</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 bg-white">
                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Tracking Number</label>
              <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. ZM1234567890"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors
                ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#2D2D2D] hover:bg-black"}`}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Right - Customer & shipping */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">Customer</h2>
            <p className="text-sm font-medium text-gray-800">{order.customer?.name ?? order.guestName ?? "Guest"}</p>
            <p className="text-xs text-gray-400 mt-1">{order.customer?.email ?? order.guestEmail}</p>
            {order.customer?.phone && <p className="text-xs text-gray-400">{order.customer.phone}</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-[#2D2D2D] mb-4">Shipping Address</h2>
            {address ? (
              <>
                <p className="text-sm text-gray-700">{address.address}</p>
                <p className="text-sm text-gray-700">{address.city}, {address.province}</p>
                {address.phone && <p className="text-xs text-gray-400 mt-1">{address.phone}</p>}
              </>
            ) : (
              <p className="text-xs text-gray-400">No address provided</p>
            )}
          </div>

          {order.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
              <h2 className="font-semibold text-amber-800 mb-2 text-sm">Order Notes</h2>
              <p className="text-xs text-amber-700 leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}