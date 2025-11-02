import { Building2 } from "lucide-react";

const DEFAULT_TITLE = "Customer Name";

/**
 * Reusable Customer Branding Component
 * @param {string} title - Customer display name
 * @param {ReactNode} logo - Optional logo element (e.g., <img />)
 */
export function CustomerBranding({ title = DEFAULT_TITLE, logo = <Building2 className="size-4 text-muted-foreground" /> }) {
  const resolvedTitle =
    typeof title === "string" && title.trim().length > 0 ? title.trim() : DEFAULT_TITLE;

  return (
    <span className="flex items-center gap-2" aria-label="Customer Branding">
      <span
        className="flex size-6 items-center justify-center overflow-hidden rounded-sm bg-sidebar border border-border"
        aria-label="Customer Logo"
      >
        {logo}
      </span>
      <span className="text-base font-semibold leading-none" title={resolvedTitle}>
        {resolvedTitle}
      </span>
    </span>
  );
}
