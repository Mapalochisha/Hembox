import CartDrawer from "@/components/store/CartDrawer";
import StoreNav from "@/components/store/StoreNav";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-[#111] min-h-screen" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <StoreNav />
      <CartDrawer />
      {children}
      <footer className="bg-[#111] text-white px-6 md:px-10 py-12 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <p className="font-black text-sm tracking-widest uppercase mb-4">HemBox</p>
            <p className="opacity-35 text-xs leading-relaxed max-w-xs">Premium clothing crafted for everyday living. Based in Zambia.</p>
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
        <div className="max-w-6xl mx-auto border-t border-white/10 pt-5 flex flex-col md:flex-row justify-between gap-2">
          <p className="text-xs opacity-25">© 2026 HemBox. All rights reserved.</p>
          <p className="text-xs opacity-25">Made in Zambia 🇿🇲</p>
        </div>
      </footer>
    </div>
  );
}