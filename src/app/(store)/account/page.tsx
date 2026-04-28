import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { User, Package, MapPin, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/account/login");
  }

  const customer = await db.customer.findUnique({
    where: { id: (session.user as any).id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      addresses: true,
    },
  });

  if (!customer) {
    redirect("/account/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">My Account</h1>
          <p className="text-xs opacity-50 uppercase tracking-widest mt-2">Welcome back, {customer.name}</p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/api/auth/signout" 
            className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-8">
          <section className="p-8 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <User size={18} className="opacity-30" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Profile Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Full Name</p>
                <p className="text-sm font-medium">{customer.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Email Address</p>
                <p className="text-sm font-medium">{customer.email}</p>
              </div>
            </div>
          </section>

          <section className="p-8 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <MapPin size={18} className="opacity-30" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Addresses</h2>
            </div>
            {customer.addresses.length > 0 ? (
              <div className="space-y-4">
                {customer.addresses.map(addr => (
                  <div key={addr.id} className="text-sm">
                    <p>{addr.line1}, {addr.line2}</p>
                    <p>{addr.city}, {addr.state} {addr.zip}</p>
                    <p>{addr.country}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-50 italic">No addresses saved yet.</p>
            )}
            <button className="mt-6 w-full py-3 border border-black dark:border-white text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
              Manage Addresses
            </button>
          </section>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <section className="p-8 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5 h-full">
            <div className="flex items-center gap-3 mb-8">
              <Package size={18} className="opacity-30" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Recent Orders</h2>
            </div>
            
            {customer.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/5">
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Order #</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Date</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Status</th>
                      <th className="pb-4 text-[10px] font-bold uppercase tracking-widest opacity-40 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {customer.orders.map(order => (
                      <tr key={order.id} className="border-b border-black/5 dark:border-white/5 last:border-0">
                        <td className="py-4 font-bold">{order.orderNumber}</td>
                        <td className="py-4 opacity-60">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-[10px] font-bold uppercase tracking-tighter">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold">${Number(order.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={48} className="opacity-10 mb-4" />
                <p className="text-sm opacity-50 mb-6">You haven&apos;t placed any orders yet.</p>
                <Link href="/products" className="px-8 py-4 bg-[#111] dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity">
                  Start Shopping
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
