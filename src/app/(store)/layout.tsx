import Link from "next/link";
import CartDrawer from "@/components/store/CartDrawer";
import CartIcon from "@/components/store/CartIcon";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }} className="bg-white text-[#111] min-h-screen">

      {/* Top utility bar */}
      <div className="bg-[#111] text-white px-10 py-1.5 flex justify-between items-center text-xs tracking-widest">
        <div className="flex gap-4 opacity-60">
          {["FB","TW","IG","YT"].map(s => <span key={s} className="cursor-pointer hover:opacity-100 transition-opacity">{s}</span>)}
        </div>
        <div className="flex gap-4 opacity-70">
          <Link href="/account/login" className="hover:opacity-100 transition-opacity">Log In</Link>
          <span className="opacity-30">|</span>
          <Link href="/account/register" className="hover:opacity-100 transition-opacity">Register Account</Link>
        </div>
      </div>

      {/* Glassy Nav */}
      <nav className="sticky top-0 z-40 px-10 flex items-center justify-between h-14"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(255,255,255,0.55)",
          borderBottom: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
        }}>
        <div className="flex items-center gap-2">
          <Link href="/" className="font-black text-sm tracking-widest uppercase">🛒 HemBox</Link>
        </div>
        <div className="flex gap-8 items-center">
          {[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            { label: "Men", href: "/categories/men" },
            { label: "Women", href: "/categories/women" },
            { label: "Kids", href: "/categories/kids" },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="text-xs tracking-widest uppercase font-medium opacity-70 hover:opacity-100 transition-opacity">
              {item.label}
            </Link>
          ))}
          <CartIcon />
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Page content */}
      {children}

      {/* Footer */}
      <footer className="bg-[#111] text-white px-10 py-12 mt-12">
        <div className="grid grid-cols-4 gap-8 mb-10">
          <div>
            <p className="font-black text-sm tracking-widest uppercase mb-4">HemBox</p>
            <p className="opacity-35 text-xs leading-relaxed">Premium clothing crafted for everyday living. Based in Zambia.</p>
          </div>
          {[
            { title: "SHOP", links: ["Men", "Women", "Kids", "New Arrivals", "Sale"] },
            { title: "HELP", links: ["Shipping Info", "Returns", "Size Guide", "Contact Us"] },
            { title: "COMPANY", links: ["About Us", "Privacy Policy", "Terms"] },
          ].map(col => (
            <div key={col.title}>
              <p className="text-xs tracking-widest opacity-35 mb-4">{col.title}</p>
              {col.links.map(link => (
                <p key={link} className="text-xs opacity-50 mb-2 cursor-pointer hover:opacity-80 transition-opacity">{link}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-5 flex justify-between">
          <p className="text-xs opacity-25">© 2026 HemBox. All rights reserved.</p>
          <p className="text-xs opacity-25">Made in Zambia 🇿🇲</p>
        </div>
      </footer>
    </div>
  );
}