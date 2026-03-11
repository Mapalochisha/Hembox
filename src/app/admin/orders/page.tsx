import { db } from "@/lib/db";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default async function OrdersPage() {
  const orders = await db.order.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Orders</h1>
        <p className="text-gray-500 text-sm mt-0.5">{orders.length} orders total</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
          <ShoppingCart size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 font-medium mb-1">No orders yet</h3>
          <p className="text-gray-500 text-sm">Orders will appear here once customers start purchasing.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Items</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">#{order.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.customer?.name ?? order.guestName ?? "Guest"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "DELIVERED"  ? "bg-green-100 text-green-700"  :
                      order.status === "SHIPPED"    ? "bg-blue-100 text-blue-700"    :
                      order.status === "CONFIRMED"  ? "bg-purple-100 text-purple-700":
                      order.status === "CANCELLED"  ? "bg-red-100 text-red-600"      :
                      order.status === "REFUNDED"   ? "bg-orange-100 text-orange-600":
                                                      "bg-gray-100 text-gray-600"
                    }`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.items.length}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">K {Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      View
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