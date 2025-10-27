import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

const STATUS_VARIANTS = {
  operational: {
    variant: "default",
    className: "bg-emerald-500 text-emerald-50 dark:bg-emerald-400",
    label: "Operational",
  },
  degraded: {
    variant: "secondary",
    className: "bg-amber-500 text-amber-50 dark:bg-amber-400",
    label: "Degraded",
  },
  outage: {
    variant: "destructive",
    className: "bg-red-500 text-red-50 dark:bg-red-400",
    label: "Outage",
  },
  unknown: {
    variant: "outline",
    className: "text-muted-foreground",
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
  const { label, variant, className: variantClassName } = STATUS_VARIANTS[normalized];

  return (
    <Badge
      variant={variant}
      className={cn("uppercase tracking-wide", variantClassName, className)}
      {...props}
    >
      {label}
    </Badge>
  );
}
