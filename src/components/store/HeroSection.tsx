"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  { label: "New Arrivals — 2026", headline: "DRESSED\nFOR LIFE.", sub: "Premium everyday clothing", href: "/products" },
  { label: "Women's Edit", headline: "EFFORTLESS\nSTYLE.", sub: "The new women's collection", href: "/categories/women" },
  { label: "Men's Collection", headline: "SHARP &\nMODERN.", sub: "Refined menswear essentials", href: "/categories/men" },
  { label: "Kids Range", headline: "PLAY IN\nSTYLE.", sub: "Built for active little ones", href: "/categories/kids" },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  // Entry animation on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      goToSlide((active + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [active]);

  function goToSlide(index: number) {
    if (animating || index === active) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(index);
      setAnimating(false);
    }, 400);
  }

  const slide = slides[active];

  return (
    <div className="relative min-h-[560px] flex items-end overflow-hidden"
      style={{ background: "linear-gradient(135deg, #c8c4be 0%, #b5b0aa 100%)" }}>

      {/* Animated background text */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-6 md:px-10 pt-5 z-10 select-none pointer-events-none">
        <span className="text-6xl md:text-8xl font-black leading-none"
          style={{ color: "rgba(0,0,0,0.06)", transition: "opacity 0.6s ease", opacity: visible ? 1 : 0 }}>
          FOR
        </span>
        <span className="text-6xl md:text-8xl font-black leading-none"
          style={{ color: "rgba(0,0,0,0.06)", transition: "opacity 0.6s ease 0.2s", opacity: visible ? 1 : 0 }}>
          EVERYONE
        </span>
      </div>

      {/* Center image placeholder */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[160px] md:text-[200px]"
          style={{ opacity: 0.15, transition: "transform 0.6s ease, opacity 0.6s ease", transform: visible ? "scale(1)" : "scale(0.9)" }}>
          👔
        </span>
      </div>

      {/* Slide indicators — top right */}
      <div className="absolute top-6 right-6 md:right-10 z-20 text-right">
        <p className="text-xs opacity-50 mb-2 tracking-widest">0{active + 1} / 0{slides.length}</p>
        <div className="flex flex-col gap-1.5 items-end">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goToSlide(i)}
              style={{ height: 2, width: i === active ? 32 : 16, background: "#111", opacity: i === active ? 1 : 0.3, transition: "all 0.4s ease", cursor: "pointer", border: "none", padding: 0 }} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] tracking-[4px] opacity-35 z-20 hidden md:block select-none">
        SCROLL
      </div>

      {/* Hero content */}
      <div className="relative z-20 px-6 md:px-10 pb-12 w-full">
        <div className="max-w-2xl">
          {/* Label */}
          <p className="text-xs tracking-[4px] uppercase mb-3"
            style={{ opacity: animating ? 0 : 0.5, transform: animating ? "translateY(8px)" : "translateY(0)", transition: "all 0.4s ease" }}>
            {slide.label}
          </p>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black leading-[0.92] tracking-[-3px] mb-6 whitespace-pre-line"
            style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(16px)" : "translateY(0)", transition: "all 0.4s ease 0.05s" }}>
            {slide.headline}
          </h1>

          {/* CTA */}
          <div className="flex items-center gap-4"
            style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(12px)" : "translateY(0)", transition: "all 0.4s ease 0.1s" }}>
            <Link href={slide.href}
              className="border border-[#111] px-6 py-2.5 text-xs tracking-widest uppercase font-medium hover:bg-[#111] hover:text-white transition-colors duration-200">
              Shop Now
            </Link>
            <span className="text-xs opacity-40">{slide.sub}</span>
          </div>
        </div>

        {/* Year stamp */}
        <div className="absolute right-6 md:right-10 bottom-12 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#111] opacity-40" />
          <span className="text-xs tracking-widest opacity-40">2026</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-black/10">
        <div className="h-full bg-[#111]/30"
          style={{ width: `${((active + 1) / slides.length) * 100}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Slide tabs */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 md:gap-2 px-4">
        {slides.map((s, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className="px-2 md:px-4 py-1 text-[9px] md:text-xs tracking-widest uppercase transition-all"
            style={{ opacity: i === active ? 1 : 0.35, borderBottom: i === active ? "2px solid #111" : "2px solid transparent", fontWeight: i === active ? 700 : 400, background: "none", border: "none", cursor: "pointer" }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}