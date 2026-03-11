import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [productCount, orderCount, customerCount] = await Promise.all([
    db.product.count(),
    db.order.count(),
    db.customer.count(),
  ]);

  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const stats = [
    { label: "Total Products",  value: productCount,  icon: Package,       color: "bg-blue-50 text-blue-600" },
    { label: "Total Orders",    value: orderCount,    icon: ShoppingCart,  color: "bg-green-50 text-green-600" },
    { label: "Total Customers", value: customerCount, icon: Users,         color: "bg-purple-50 text-purple-600" },
    { label: "Revenue",         value: "K 0.00",      icon: LayoutDashboard, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session.user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2D2D2D]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-[#2D2D2D]">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingCart size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No orders yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <th className="px-6 py-3 text-left">Order</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#2D2D2D]">
                    #{order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#2D2D2D]">
                    K {Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}