"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import CartIcon from "@/components/store/CartIcon";
import DarkModeToggle from "@/components/store/DarkModeToggle";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Men", href: "/categories/men" },
  { label: "Women", href: "/categories/women" },
  { label: "Kids", href: "/categories/kids" },
];

export default function StoreNav() {
  const { data: session, status } = useSession();
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
          {status === "authenticated" ? (
            <>
              <Link href="/account" className="hover:opacity-100 transition-opacity flex items-center gap-1">
                <User size={10} />
                My Account
              </Link>
              <span className="opacity-30">|</span>
              <button onClick={() => signOut()} className="hover:opacity-100 transition-opacity flex items-center gap-1">
                <LogOut size={10} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/account/login" className="hover:opacity-100 transition-opacity">Log In</Link>
              <span className="opacity-30">|</span>
              <Link href="/account/register" className="hover:opacity-100 transition-opacity">Register</Link>
            </>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav
        className={`sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between h-14 transition-all duration-300 backdrop-blur-xl ${
          scrolled 
            ? "bg-white/90 dark:bg-[#0f0f0f]/90 border-b border-black/10 dark:border-white/10 shadow-[0_4px_32px_rgba(0,0,0,0.08)] dark:shadow-none" 
            : "bg-white/50 dark:bg-[#0f0f0f]/50 border-b border-white/40 dark:border-white/5 shadow-[0_2px_24px_rgba(0,0,0,0.04)] dark:shadow-none"
        }`}>

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
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#111] dark:bg-white" />
              )}
            </Link>
          ))}
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <CartIcon />
          </div>
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-4">
          <DarkModeToggle />
          <CartIcon />
          <button onClick={() => setMenuOpen(v => !v)} className="p-1">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-white dark:bg-[#0f0f0f] flex flex-col pt-28 px-8"
          style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          <div className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link key={link.href} href={link.href}
                className={`text-4xl font-black tracking-tight uppercase py-3 border-b border-gray-100 dark:border-white/10 transition-colors
                  ${pathname === link.href ? "text-[#111] dark:text-white" : "text-gray-300 dark:text-gray-600 hover:text-[#111] dark:hover:text-white"}`}
                style={{ animationDelay: `${i * 60}ms` }}>
                {link.label}
              </Link>
            ))}
            {status === "authenticated" && (
              <Link href="/account"
                className={`text-4xl font-black tracking-tight uppercase py-3 border-b border-gray-100 dark:border-white/10 transition-colors
                  ${pathname === "/account" ? "text-[#111] dark:text-white" : "text-gray-300 dark:text-gray-600 hover:text-[#111] dark:hover:text-white"}`}
                style={{ animationDelay: `${navLinks.length * 60}ms` }}>
                Account
              </Link>
            )}
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