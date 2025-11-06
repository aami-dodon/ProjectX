import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function RoleInheritanceGraph({ role, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Relationships</CardTitle>
          <CardDescription>Resolving hierarchy…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!role) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Relationships</CardTitle>
          <CardDescription>No role selected.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const parent = role.inheritsRole;
  const children = role.childRoles ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Relationships</CardTitle>
        <CardDescription>Inheritance graph for {role.name}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section>
          <p className="text-xs uppercase text-muted-foreground">Parent Role</p>
          {parent ? (
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">{parent.name}</Badge>
              <span className="text-xs text-muted-foreground">Domain: {parent.domain || "global"}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">No parent role — this role sits at the top of its domain.</p>
          )}
        </section>
        <section>
          <p className="text-xs uppercase text-muted-foreground">Child Roles</p>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-1">No child roles inherit from {role.name}.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {children.map((child) => (
                <Badge key={child.id} variant="outline">
                  {child.name}
                </Badge>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
