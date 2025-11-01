import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/ui/sonner";

const scrollbarFallbackStyles = `
:root {
  --scrollbar-track: color-mix(in oklab, var(--background) 92%, transparent);
  --scrollbar-thumb: var(--border);
  --scrollbar-thumb-hover: color-mix(in oklab, var(--border) 65%, var(--foreground));
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

*::-webkit-scrollbar {
  width: 0.75rem;
  height: 0.75rem;
}

*::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

*::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover);
}
`;

function ScrollbarFallbackStyles() {
  return <style>{scrollbarFallbackStyles}</style>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <>
      <ScrollbarFallbackStyles />
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  </ThemeProvider>
);
