"use client";

import { useTheme } from "@/app/admin/_context/theme-provider";
import { Moon, Sun, MonitorCog } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else setTheme("light");
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : MonitorCog;

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
      aria-label="Toggle theme"
      title={`Current: ${theme}`}
    >
      <Icon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
    </button>
  );
}
