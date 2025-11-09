import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { VersionDiffViewer } from "@/features/frameworks/components/version-diff-viewer";
import { fetchFramework } from "@/features/frameworks/api/frameworks-client";
import { useFrameworkVersions } from "@/features/frameworks/hooks/use-framework-versions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const STATUS_OPTIONS = ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "RETIRED"];

export function VersionHistoryPage() {
  const { frameworkId } = useParams();
  const [framework, setFramework] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [formState, setFormState] = useState({
    version: "",
    status: "DRAFT",
    changelog: "",
  });
  const { versions, isLoading, createVersion, refresh } = useFrameworkVersions(frameworkId);

  useEffect(() => {
    async function load() {
      if (!frameworkId) return;
      const response = await fetchFramework(frameworkId);
      setFramework(response?.data ?? null);
    }
    load();
  }, [frameworkId]);

  useEffect(() => {
    if (versions.length && !selectedVersionId) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelect = (field) => (value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await createVersion({
        version: formState.version,
        status: formState.status,
        changelog: formState.changelog || undefined,
      });
      setFormState({ version: "", status: "DRAFT", changelog: "" });
      toast.success("Version created");
      await refresh();
    } catch (error) {
      toast.error(error?.message ?? "Unable to create version");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase text-muted-foreground">{framework?.slug}</p>
        <h1 className="text-3xl font-semibold">Version history</h1>
        <p className="text-sm text-muted-foreground">
          Track each publish-ready snapshot for {framework?.title ?? "this framework"}.
        </p>
      </header>

      <VersionDiffViewer
        versions={versions}
        selectedVersionId={selectedVersionId}
        onSelect={setSelectedVersionId}
      />

      <Card as="form" onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create version</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Version">
            <Input value={formState.version} onChange={handleChange("version")} required placeholder="1.2.0" />
          </Field>
          <Field label="Status">
            <Select value={formState.status} onValueChange={handleSelect("status")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Changelog" className="md:col-span-2">
            <Textarea
              rows={4}
              value={formState.changelog}
              onChange={handleChange("changelog")}
              placeholder="Summarize what changed in this version."
            />
          </Field>
        </CardContent>
        <div className="flex justify-end px-6 pb-6">
          <Button type="submit" disabled={isLoading}>
            Save version
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
