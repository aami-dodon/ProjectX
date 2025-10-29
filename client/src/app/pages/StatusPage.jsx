import { Children } from "react";
import { Badge } from "@/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui";

function StatusPage({
  icon: Icon,
  iconBackgroundClassName = "bg-muted",
  iconClassName = "text-muted-foreground",
  status,
  statusLabel,
  title,
  description,
  children,
  actions = [],
}) {
  const actionItems = Children.toArray(actions);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="items-center gap-4">
          {Icon ? (
            <span
              className={`flex size-16 items-center justify-center rounded-full ${iconBackgroundClassName}`}
            >
              <Icon className={`size-8 ${iconClassName}`} aria-hidden="true" />
            </span>
          ) : null}
          {status ? (
            <Badge variant="outline" className="uppercase tracking-wide text-muted-foreground">
              {statusLabel ?? `Status ${status}`}
            </Badge>
          ) : null}
          <CardTitle className="text-3xl">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        {children ? (
          <CardContent className="space-y-4 text-muted-foreground">{children}</CardContent>
        ) : null}
        {actionItems.length > 0 ? (
          <CardFooter className="flex flex-wrap items-center justify-center gap-3">
            {actionItems.map((action, index) => (
              <span key={action.key ?? index} className="flex">
                {action}
              </span>
            ))}
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}

export { StatusPage };
