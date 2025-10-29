import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useTheme } from "@/shared/components/theme-provider";
import { cn } from "@/shared/lib/utils";

const nextTheme = (currentTheme) => {
  if (currentTheme === "system") return "dark";
  if (currentTheme === "dark") return "light";
  return "system";
};

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    const updatedTheme = nextTheme(currentTheme);
    setTheme(updatedTheme);
    setCurrentTheme(updatedTheme);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className="relative"
    >
      <Sun
        className={cn(
          "size-[1.2rem] rotate-0 scale-100 transition-all",
          currentTheme !== "light" && "-rotate-90 scale-0"
        )}
      />
      <Moon
        className={cn(
          "absolute size-[1.2rem] rotate-90 scale-0 transition-all",
          currentTheme === "dark" && "rotate-0 scale-100"
        )}
      />
      <Laptop
        className={cn(
          "absolute size-[1.2rem] rotate-90 scale-0 transition-all",
          currentTheme === "system" && "rotate-0 scale-100"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
