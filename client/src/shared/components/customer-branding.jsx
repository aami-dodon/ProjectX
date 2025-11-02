import { Building2 } from "lucide-react"

const DEFAULT_TITLE = "Customer Name"

export function CustomerBranding({ title = DEFAULT_TITLE }) {
  const resolvedTitle = typeof title === "string" && title.trim().length > 0 ? title.trim() : DEFAULT_TITLE

  return (
    <span className="flex items-center gap-2">
      <span
        className="flex size-6 items-center justify-center overflow-hidden rounded-sm bg-sidebar border border-border"
        aria-label="Customer Logo"
        title="Customer Logo"
      >
        <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
      </span>
      <span
        className="text-base font-semibold leading-none"
        aria-label="Customer Name"
        title={resolvedTitle}
      >
        {resolvedTitle}
      </span>
    </span>
  )
}
