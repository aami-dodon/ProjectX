import { Moon, Sun, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { useState, useEffect } from "react"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState(theme)

  useEffect(() => {
    setCurrentTheme(theme)
  }, [theme])

  const handleToggle = () => {
    let nextTheme
    if (currentTheme === "system") {
      nextTheme = "dark"
    } else if (currentTheme === "dark") {
      nextTheme = "light"
    } else {
      nextTheme = "system"
    }
    setTheme(nextTheme)
    setCurrentTheme(nextTheme)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {/* Sun icon for light mode */}
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all
          ${currentTheme === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`}
      />

      {/* Moon icon for dark mode */}
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all
          ${currentTheme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`}
      />

      {/* Laptop icon for system mode */}
      <Laptop
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all
          ${currentTheme === "system" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`}
      />
    </Button>
  )
}
