import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { StatusBadge } from "./StatusBadge";

export function HealthStatusCard({
  description,
  footer,
  items = [],
  status,
  title,
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length > 0 ? (
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="grid grid-cols-1 gap-2 bg-background/60 px-4 py-3 text-sm sm:grid-cols-[240px_1fr]"
              >
                <div className="flex flex-col gap-1 text-muted-foreground">
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.helpText ? <span>{item.helpText}</span> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No diagnostic details available.</p>
        )}
        {footer ? (
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <Separator />
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
