import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Store,
  Palette,
} from "lucide-react";

const navItems = [
  { href: "/admin",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/products",   label: "Products",   icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders",     label: "Orders",     icon: ShoppingCart },
  { href: "/admin/customers",  label: "Customers",  icon: Users },
  { href: "/admin/theme",      label: "Theme",      icon: Palette },
  { href: "/admin/settings",   label: "Settings",   icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      <aside className="w-60 bg-[#2D2D2D] text-white flex flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-white/70" />
            <span className="font-bold text-lg tracking-tight">HemBox</span>
          </div>
          <p className="text-white/40 text-xs mt-0.5 mb-3">Admin Dashboard</p>
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all">
            View Store
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-sm font-medium truncate">{session.user?.name}</p>
            <p className="text-white/40 text-xs truncate">{session.user?.email}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign out
          </Link>
        </div>
      </aside>
      <div className="flex-1 ml-60">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}