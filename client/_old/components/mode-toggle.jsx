import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  const themes = ["light", "dark", "system"];

  // Keep internal state in sync with external theme
  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setCurrentTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleToggle}>
      {currentTheme === "light" && (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      {currentTheme === "dark" && (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      {currentTheme === "system" && (
        <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
