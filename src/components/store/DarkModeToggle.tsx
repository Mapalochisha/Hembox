"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render only after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="w-8 h-8" />;
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    if (theme === "system") return <Monitor size={16} strokeWidth={2} />;
    if (resolvedTheme === "dark") return <Sun size={16} strokeWidth={2} />;
    return <Moon size={16} strokeWidth={2} />;
  };

  const getLabel = () => {
    if (theme === "system") return "System mode (Click for light)";
    if (resolvedTheme === "dark") return "Dark mode (Click for system)";
    return "Light mode (Click for dark)";
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={getLabel()}
      title={getLabel()}
      className="p-2 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 text-[#111] dark:text-white/80 flex items-center justify-center relative group"
    >
      <div className="transition-transform duration-300 group-hover:scale-110">
        {getIcon()}
      </div>
      {theme === "system" && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-[#0f0f0f]" />
      )}
    </button>
  );
}
