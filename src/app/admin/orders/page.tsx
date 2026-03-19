"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  guestName: string | null;
  guestEmail: string | null;
  shippingAddress: any;
  customer: { name: string | null; email: string } | null;
  items: { id: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED:  "bg-green-50 text-green-700 border-green-200",
  CANCELLED:  "bg-red-50 text-red-700 border-red-200",
  REFUNDED:   "bg-gray-50 text-gray-700 border-gray-200",
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID:      "bg-green-50 text-green-700 border-green-200",
  FAILED:    "bg-red-50 text-red-700 border-red-200",
  REFUNDED:  "bg-gray-50 text-gray-700 border-gray-200",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); });
  }, []);

  const filtered = filter === "ALL" 
  ? orders.filter(o => o.status !== "ARCHIVED")
  : filter === "ARCHIVED"
  ? orders.filter(o => o.status === "ARCHIVED")
  : orders.filter(o => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "ARCHIVED"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors
              ${filter === s ? "bg-[#2D2D2D] text-white border-[#2D2D2D]" : "border-gray-200 hover:bg-gray-50"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">📦</p>
          <h2 className="font-semibold text-gray-700 mb-1">No orders yet</h2>
          <p className="text-sm text-gray-400">Orders will appear here once customers start buying.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Order", "Customer", "Items", "Total", "Status", "Payment", "Date", ""].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-[#2D2D2D] font-mono">{order.orderNumber}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-700">
                      {order.customer?.name ?? order.guestName ?? "Guest"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.customer?.email ?? order.guestEmail ?? ""}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-600">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">K {Number(order.total).toFixed(2)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${PAYMENT_COLORS[order.paymentStatus] ?? ""}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${order.id}`}
                      className="text-xs font-medium text-[#2D2D2D] hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}