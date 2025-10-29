import { Badge } from "@/ui";
import { cn } from "@/lib";

const STATUS_VARIANTS = {
  operational: {
    variant: "default",
    label: "Operational",
  },
  degraded: {
    variant: "secondary",
    label: "Degraded",
  },
  outage: {
    variant: "destructive",
    label: "Outage",
  },
  unknown: {
    variant: "outline",
    label: "Unknown",
  },
};

const normalizeStatus = (status) => {
  if (!status) return "unknown";
  const normalized = String(status).toLowerCase();
  return STATUS_VARIANTS[normalized] ? normalized : "unknown";
};

export function StatusBadge({ className, status, ...props }) {
  const normalized = normalizeStatus(status);
  const { label, variant } = STATUS_VARIANTS[normalized];

  return (
    <Badge
      variant={variant}
      className={cn(
        "uppercase tracking-wide font-medium",
        className
      )}
      {...props}
    >
      {label}
    </Badge>
  );
}
