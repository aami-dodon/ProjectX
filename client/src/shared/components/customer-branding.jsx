import { Building2 } from "lucide-react"

export function CustomerBranding({
  customerLogo,
  title,
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="flex size-6 items-center justify-center overflow-hidden rounded-sm bg-sidebar border border-border"
        aria-label="Customer Logo"
        title="Customer Logo"
      >
        {customerLogo ? (
          <img
            src={customerLogo}
            alt={`${title} customer logo`}
            className="size-full object-contain"
          />
        ) : (
          <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
        )}
      </span>
      <span
        className="text-base font-semibold leading-none"
        aria-label="Customer Name"
        title="Customer Name"
      >
        {title}
      </span>
    </span>
  )
}
