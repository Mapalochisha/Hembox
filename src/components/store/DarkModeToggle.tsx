"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render only after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="w-8 h-8" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 text-[#111] dark:text-white/80"
    >
      {isDark ? (
        <Sun size={16} strokeWidth={2} className="transition-transform duration-300 rotate-0 hover:rotate-12" />
      ) : (
        <Moon size={16} strokeWidth={2} className="transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
