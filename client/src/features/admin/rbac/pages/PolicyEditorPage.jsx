import { useState } from "react";

import { createPolicy, deletePolicy } from "@/features/admin/rbac/api/rbac-client";
import { usePolicies } from "@/features/admin/rbac/hooks/usePolicies";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

const DEFAULT_DOMAIN = "global";

const INITIAL_FORM = {
  subject: "",
  object: "",
  action: "",
  effect: "allow",
  description: "",
};

export function PolicyEditorPage() {
  const [domain] = useState(DEFAULT_DOMAIN);
  const { policies, isLoading, error, refresh } = usePolicies({ domain });
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await createPolicy({ ...form, domain });
      setForm(INITIAL_FORM);
      await refresh();
    } catch (err) {
      setFormError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (policyId) => {
    if (!policyId) {
      return;
    }

    await deletePolicy(policyId, { summary: "Archived via UI" });
    await refresh();
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Policy Editor</CardTitle>
            <CardDescription>Define Casbin policies scoped to the {domain} domain.</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">{error.message ?? "Failed to load policies."}</p>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Effect</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Loading policies…
                    </TableCell>
                  </TableRow>
                ) : policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No policies found.
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="capitalize">{policy.subject || "—"}</TableCell>
                      <TableCell>{policy.object || "*"}</TableCell>
                      <TableCell>{policy.action || "*"}</TableCell>
                      <TableCell>
                        <Badge variant={policy.effect === "deny" ? "destructive" : "outline"}>
                          {policy.effect}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                        >
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Policy</CardTitle>
            <CardDescription>New policies take effect immediately after saving.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="admin"
                  value={form.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="object">Resource</Label>
                <Input
                  id="object"
                  name="object"
                  placeholder="rbac:roles"
                  value={form.object}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="action">Action</Label>
                <Input
                  id="action"
                  name="action"
                  placeholder="read"
                  value={form.action}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {formError ? (
                <p className="text-sm text-destructive">{formError.message ?? "Unable to save policy."}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Policies are scoped to {domain}.</p>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save policy"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
