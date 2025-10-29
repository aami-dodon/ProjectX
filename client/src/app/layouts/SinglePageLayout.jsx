import { useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { IconArrowLeft, IconHome } from "@tabler/icons-react";

import { Button } from "@/shared/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle"; // 🌗 Theme toggle

export default function SinglePageLayout() {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleHome = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 lg:px-6">
          {/* 👈 Left: Back Button */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleBack}
          >
            <IconArrowLeft className="size-4" />
            Back
          </Button>

          {/* 👉 Right: Home + Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleHome}
            >
              <IconHome className="size-4" />
              Home
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
}
