"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeroSlide {
  label: string;
  headline: string;
  sub: string;
  href: string;
  imageUrl?: string | null;
}

interface Props {
  categories?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
  }[];
}

const fallbackSlides: HeroSlide[] = [
  { label: "New Arrivals — 2026", headline: "DRESSED\nFOR LIFE.", sub: "Premium everyday clothing", href: "/products" },
  { label: "Women's Edit", headline: "EFFORTLESS\nSTYLE.", sub: "The new women's collection", href: "/categories/women" },
  { label: "Men's Collection", headline: "SHARP &\nMODERN.", sub: "Refined menswear essentials", href: "/categories/men" },
  { label: "Kids Range", headline: "PLAY IN\nSTYLE.", sub: "Built for active little ones", href: "/categories/kids" },
];

export default function HeroSection({ categories }: Props) {
  const slides: HeroSlide[] =
    categories && categories.length > 0
      ? categories.map((cat) => ({
          label: cat.name,
          headline: cat.name.toUpperCase().replace(/\s+/g, "\n"),
          sub: cat.description || `Shop ${cat.name}`,
          href: `/categories/${cat.slug}`,
          imageUrl: cat.imageUrl,
        }))
      : fallbackSlides;

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
  }, [active, slides.length]);

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
    <div className="relative min-h-[560px] flex items-end overflow-hidden bg-gradient-to-br from-[#c8c4be] to-[#b5b0aa] dark:from-[#2a2a2a] dark:to-[#1a1a1a]">

      {/* Background image from collection */}
      {slide.imageUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={slide.imageUrl}
            alt={slide.label}
            className="w-full h-full object-cover"
            style={{
              opacity: animating ? 0 : 1,
              transition: "opacity 0.6s ease",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>
      )}

      {/* Animated background text */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-6 md:px-10 pt-5 z-10 select-none pointer-events-none">
        <span className="text-6xl md:text-8xl font-black leading-none text-black/5 dark:text-white/5"
          style={{ transition: "opacity 0.6s ease", opacity: visible ? 1 : 0 }}>
          FOR
        </span>
        <span className="text-6xl md:text-8xl font-black leading-none text-black/5 dark:text-white/5"
          style={{ transition: "opacity 0.6s ease 0.2s", opacity: visible ? 1 : 0 }}>
          EVERYONE
        </span>
      </div>

      {/* Center image placeholder — only show when no collection image */}
      {!slide.imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[160px] md:text-[200px]"
            style={{ opacity: 0.15, transition: "transform 0.6s ease, opacity 0.6s ease", transform: visible ? "scale(1)" : "scale(0.9)" }}>
            👔
          </span>
        </div>
      )}

      {/* Slide indicators — top right */}
      <div className="absolute top-6 right-6 md:right-10 z-20 text-right">
        <p className="text-xs opacity-50 mb-2 tracking-widest"
          style={{ color: slide.imageUrl ? "white" : "inherit" }}>
          0{active + 1} / 0{slides.length}
        </p>
        <div className="flex flex-col gap-1.5 items-end">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goToSlide(i)}
              style={{
                height: 2,
                width: i === active ? 32 : 16,
                background: slide.imageUrl ? "#fff" : "currentColor",
                opacity: i === active ? 1 : 0.3,
                transition: "all 0.4s ease",
                cursor: "pointer",
                border: "none",
                padding: 0,
              }} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] tracking-[4px] opacity-35 z-20 hidden md:block select-none"
        style={{ color: slide.imageUrl ? "white" : "inherit" }}>
        SCROLL
      </div>

      {/* Hero content */}
      <div className="relative z-20 px-6 md:px-10 pb-12 w-full">
        <div className="max-w-2xl">
          {/* Label */}
          <p className="text-xs tracking-[4px] uppercase mb-3"
            style={{
              opacity: animating ? 0 : 0.5,
              transform: animating ? "translateY(8px)" : "translateY(0)",
              transition: "all 0.4s ease",
              color: slide.imageUrl ? "white" : "inherit",
            }}>
            {slide.label}
          </p>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black leading-[0.92] tracking-[-3px] mb-6 whitespace-pre-line"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? "translateY(16px)" : "translateY(0)",
              transition: "all 0.4s ease 0.05s",
              color: slide.imageUrl ? "white" : "inherit",
            }}>
            {slide.headline}
          </h1>

          {/* CTA */}
          <div className="flex items-center gap-4"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? "translateY(12px)" : "translateY(0)",
              transition: "all 0.4s ease 0.1s",
            }}>
            <Link href={slide.href}
              className={`border px-6 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors duration-200 ${
                slide.imageUrl
                  ? "border-white text-white hover:bg-white hover:text-[#111]"
                  : "border-[#111] text-[#111] hover:bg-[#111] hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-[#111]"
              }`}>
              Shop Now
            </Link>
            <span className="text-xs opacity-40"
              style={{ color: slide.imageUrl ? "white" : "inherit" }}>
              {slide.sub}
            </span>
          </div>
        </div>

        {/* Year stamp */}
        <div className="absolute right-6 md:right-10 bottom-12 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full opacity-40"
            style={{ background: slide.imageUrl ? "white" : "currentColor" }} />
          <span className="text-xs tracking-widest opacity-40"
            style={{ color: slide.imageUrl ? "white" : "inherit" }}>
            2026
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-black/10 dark:bg-white/10">
        <div className="h-full bg-[#111]/30 dark:bg-white/30"
          style={{ width: `${((active + 1) / slides.length) * 100}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Slide tabs */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 md:gap-2 px-4">
        {slides.map((s, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className="px-2 md:px-4 py-1 text-[9px] md:text-xs tracking-widest uppercase transition-all"
            style={{
              opacity: i === active ? 1 : 0.35,
              borderBottom: i === active ? `2px solid ${slide.imageUrl ? "white" : "currentColor"}` : "2px solid transparent",
              fontWeight: i === active ? 700 : 400,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: slide.imageUrl ? "white" : "inherit",
            }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}