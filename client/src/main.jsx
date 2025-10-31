import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/ui/sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  </ThemeProvider>
);
