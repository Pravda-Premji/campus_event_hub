import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="fixed bottom-[104px] right-6 p-4 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-50 text-indigo-600 dark:text-yellow-400 border border-slate-100 dark:border-slate-700"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
    </button>
  );
}
