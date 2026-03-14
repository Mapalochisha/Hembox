"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import CartIcon from "@/components/store/CartIcon";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Men", href: "/categories/men" },
  { label: "Women", href: "/categories/women" },
  { label: "Kids", href: "/categories/kids" },
];

export default function StoreNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top utility bar */}
      <div className="bg-[#111] text-white px-6 md:px-10 py-1.5 flex justify-between items-center text-xs tracking-widest">
        <div className="hidden md:flex gap-4 opacity-60">
          {["FB", "TW", "IG", "YT"].map(s => (
            <span key={s} className="cursor-pointer hover:opacity-100 transition-opacity">{s}</span>
          ))}
        </div>
        <div className="flex gap-4 opacity-70 mx-auto md:mx-0">
          <Link href="/account/login" className="hover:opacity-100 transition-opacity">Log In</Link>
          <span className="opacity-30">|</span>
          <Link href="/account/register" className="hover:opacity-100 transition-opacity">Register</Link>
        </div>
      </div>

      {/* Main nav */}
      <nav
        className="sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between h-14 transition-all duration-300"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.4)",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.08)" : "0 2px 24px rgba(0,0,0,0.04)",
        }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-sm tracking-widest uppercase">
          <ShoppingCart size={16} strokeWidth={2.5} />
          HemBox
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`text-xs tracking-widest uppercase font-medium transition-all duration-200 relative
                ${pathname === link.href ? "opacity-100" : "opacity-50 hover:opacity-100"}
              `}>
              {link.label}
              {pathname === link.href && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#111]" />
              )}
            </Link>
          ))}
          <CartIcon />
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-4">
          <CartIcon />
          <button onClick={() => setMenuOpen(v => !v)} className="p-1">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-white flex flex-col pt-28 px-8"
          style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          <div className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link key={link.href} href={link.href}
                className={`text-4xl font-black tracking-tight uppercase py-3 border-b border-gray-100 transition-colors
                  ${pathname === link.href ? "text-[#111]" : "text-gray-300 hover:text-[#111]"}`}
                style={{ animationDelay: `${i * 60}ms` }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto pb-12">
            <div className="flex gap-6 mb-6">
              {["FB", "TW", "IG", "YT"].map(s => (
                <span key={s} className="text-xs tracking-widest opacity-40 cursor-pointer hover:opacity-80">{s}</span>
              ))}
            </div>
            <p className="text-xs opacity-25 tracking-widest">© 2026 HEMBOX</p>
          </div>
        </div>
      )}
    </>
  );
}