import CartDrawer from "@/components/store/CartDrawer";
import StoreNav from "@/components/store/StoreNav";
import Link from "next/link";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-black text-[#111] dark:text-[#f5f5f0] min-h-screen transition-colors duration-300" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <StoreNav />
      <CartDrawer />
      {children}

      {/* Footer */}
      <footer className="bg-[#111] text-white mt-16">
        {/* Top banner */}
        <div className="border-b border-white/10 px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-10 text-xs tracking-widest uppercase opacity-50">
            {["Free Shipping Over K500", "30-Day Returns", "Authentic Quality"].map(item => (
              <span key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white opacity-40 inline-block" />
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-5">
            {["FB", "TW", "IG", "YT"].map(s => (
              <span key={s} className="text-xs tracking-widest opacity-40 cursor-pointer hover:opacity-100 transition-opacity">{s}</span>
            ))}
          </div>
        </div>

        {/* Main footer content */}
        <div className="px-6 md:px-10 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-2">
              <p className="font-black text-xl tracking-widest uppercase mb-4">HemBox</p>
              <p className="opacity-35 text-xs leading-relaxed max-w-xs mb-6">
                Premium clothing crafted for everyday living. Quality you can feel, style you can own.
              </p>
              {/* Newsletter */}
              <p className="text-xs tracking-widest uppercase opacity-50 mb-3">Stay in the loop</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-xs text-white placeholder:opacity-30 focus:outline-none focus:border-white/50 transition-colors"
                />
                <button className="bg-white text-[#111] text-xs px-4 py-2 rounded font-bold tracking-widest uppercase hover:bg-gray-100 transition-colors">
                  Join
                </button>
              </div>
            </div>

            {/* Links */}
            {[
              { title: "Shop", links: [
                { label: "Men", href: "/categories/men" },
                { label: "Women", href: "/categories/women" },
                { label: "Kids", href: "/categories/kids" },
                { label: "New Arrivals", href: "/products" },
                { label: "Sale", href: "/products" },
              ]},
              { title: "Help", links: [
                { label: "Shipping Info", href: "/" },
                { label: "Returns", href: "/" },
                { label: "Size Guide", href: "/" },
                { label: "Contact Us", href: "/" },
              ]},
              { title: "Company", links: [
                { label: "About Us", href: "/" },
                { label: "Privacy Policy", href: "/" },
                { label: "Terms", href: "/" },
              ]},
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs tracking-widest uppercase font-bold mb-5 opacity-60">{col.title}</p>
                <div className="space-y-3">
                  {col.links.map(link => (
                    <Link key={link.label} href={link.href}
                      className="block text-xs opacity-40 hover:opacity-80 transition-opacity">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs opacity-25">© 2026 HemBox. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50">HEMBOX</span>
            <span className="text-xs opacity-25">Zambia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}