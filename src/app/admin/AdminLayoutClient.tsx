"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
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

export default function AdminLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      <aside 
        className={`${
          isCollapsed ? "w-20" : "w-60"
        } bg-[#2D2D2D] text-white flex flex-col fixed h-full z-10 transition-all duration-300 ease-in-out`}
      >
        <div className={`px-6 py-5 border-b border-white/10 relative ${isCollapsed ? "px-4 flex justify-center" : ""}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <Store size={20} className="text-white/70" />
                <span className="font-bold text-lg tracking-tight">HemBox</span>
              </div>
              <p className="text-white/40 text-xs mt-0.5 mb-3">Admin Dashboard</p>
              <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all">
                View Store
              </Link>
            </>
          ) : (
            <Store size={24} className="text-white/70" />
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 bg-[#2D2D2D] border border-white/10 rounded-full p-1 text-white/50 hover:text-white transition-colors z-20"
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <item.icon size={16} className={isActive ? "text-white" : "text-white/70"} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`px-3 py-4 border-t border-white/10 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
          {!isCollapsed ? (
            <div className="px-3 py-2 mb-1">
              <p className="text-white text-sm font-medium truncate">{session.user?.name}</p>
              <p className="text-white/40 text-xs truncate">{session.user?.email}</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-2" title={session.user?.email}>
              <span className="text-[10px] font-bold uppercase">
                {session.user?.name?.substring(0, 2) || "AD"}
              </span>
            </div>
          )}
          <Link
            href="/api/auth/signout"
            title={isCollapsed ? "Sign out" : ""}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign out</span>}
          </Link>
        </div>
      </aside>
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? "ml-20" : "ml-60"}`}>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
