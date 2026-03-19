"use client";

import { useState, useEffect } from "react";
import { Users, Trash2, X, Package, Phone, Mail, Calendar, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  phone: string | null;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { id: string }[];
}

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orders: Order[];
  addresses: Address[];
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
  PENDING:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID:     "bg-green-50 text-green-700 border-green-200",
  FAILED:   "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then(r => r.json())
      .then(data => { setCustomers(data); setLoading(false); });
  }, []);

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`Delete customer ${name ?? "this customer"}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        if (selected?.id === id) setSelected(null);
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete customer");
      }
    } finally {
      setDeleting(null);
    }
  }

  const totalSpend = (customer: Customer) =>
    customer.orders.reduce((sum, o) => sum + Number(o.total), 0);

  const activeOrders = (customer: Customer) =>
    customer.orders.filter(o => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status));

  const defaultAddress = (customer: Customer) =>
    customer.addresses.find(a => a.isDefault) ?? customer.addresses[0] ?? null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Customers</h1>
        <p className="text-gray-500 text-sm mt-0.5">{customers.length} customers total</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 font-medium mb-1">No customers yet</h3>
          <p className="text-gray-500 text-sm">Customers will appear here once they place an order.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spend</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(customer => (
                <tr key={customer.id}
                  onClick={() => setSelected(customer)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900">{customer.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.orders.length}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">K {totalSpend(customer).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      disabled={deleting === customer.id}
                      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-30">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-lg text-[#2D2D2D]">{selected.name ?? "Guest Customer"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Customer Profile</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:opacity-60 transition-opacity">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact</h3>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  {selected.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Phone size={14} className="text-gray-400 flex-shrink-0" />
                  {selected.phone ?? "No phone on record"}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                  Joined {new Date(selected.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Address</h3>
                {defaultAddress(selected) ? (
                  <div className="flex items-start gap-3 text-sm text-gray-700">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{defaultAddress(selected)!.firstName} {defaultAddress(selected)!.lastName}</p>
                      <p className="text-gray-500">{defaultAddress(selected)!.address}</p>
                      <p className="text-gray-500">{defaultAddress(selected)!.city}, {defaultAddress(selected)!.province}</p>
                      {defaultAddress(selected)!.phone && <p className="text-gray-500">{defaultAddress(selected)!.phone}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <MapPin size={14} className="flex-shrink-0" />
                    No saved address — check order shipping details
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-[#2D2D2D]">{selected.orders.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Orders</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-[#2D2D2D]">{activeOrders(selected).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Active Orders</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-lg font-black text-[#2D2D2D]">K {totalSpend(selected).toFixed(0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Spend</p>
                </div>
              </div>

              {/* Active Orders */}
              {activeOrders(selected).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Active Orders</h3>
                  <div className="space-y-2">
                    {activeOrders(selected).map(order => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        onClick={() => setSelected(null)}
                        className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 hover:bg-blue-100 transition-colors">
                        <div>
                          <p className="text-sm font-bold font-mono text-[#2D2D2D]">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[order.status] ?? ""}`}>
                              {order.status}
                            </span>
                            <p className="text-xs font-bold mt-1">K {Number(order.total).toFixed(2)}</p>
                          </div>
                          <ExternalLink size={14} className="text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Purchase History</h3>
                {selected.orders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    No orders yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.orders.map(order => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        onClick={() => setSelected(null)}
                        className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold font-mono text-[#2D2D2D]">{order.orderNumber}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right space-y-1">
                            <div className="flex gap-1.5 justify-end">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] ?? ""}`}>
                                {order.status}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PAYMENT_COLORS[order.paymentStatus] ?? ""}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                            <p className="text-sm font-bold">K {Number(order.total).toFixed(2)}</p>
                          </div>
                          <ExternalLink size={14} className="text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(selected.id, selected.name)}
                  disabled={deleting === selected.id}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-30">
                  <Trash2 size={14} />
                  Delete Customer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}