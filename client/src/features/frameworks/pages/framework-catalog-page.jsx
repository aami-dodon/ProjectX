import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { FrameworkForm } from "@/features/frameworks/components/framework-form";
import { useFrameworks } from "@/features/frameworks/hooks/use-frameworks";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "RETIRED", label: "Retired" },
];

export function FrameworkCatalogPage() {
  const {
    frameworks,
    summary,
    filters,
    setFilters,
    selectedFramework,
    setSelectedFrameworkId,
    isLoading,
    createFramework,
    updateFramework,
  } = useFrameworks();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const statusSummary = useMemo(() => summary?.status ?? {}, [summary?.status]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (selectedFramework) {
        await updateFramework(selectedFramework.id, payload);
        toast.success("Framework updated");
      } else {
        const record = await createFramework(payload);
        toast.success(`Created ${record?.title ?? "framework"}`);
      }
    } catch (error) {
      toast.error(error?.message ?? "Unable to save framework");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Framework catalog</h1>
          <p className="text-sm text-muted-foreground">
            Track every framework, jurisdiction, and publisher in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSelectedFrameworkId(null)}>
            New framework
          </Button>
          {selectedFramework && (
            <Button onClick={() => navigate(`/frameworks/${selectedFramework.id}`)}>Open detail</Button>
          )}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(statusSummary).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="py-3 text-sm text-muted-foreground">
              <span>{status}</span>
            </CardHeader>
            <CardContent className="py-0 text-2xl font-semibold">{count}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1 text-sm">
                <Label htmlFor="framework-search">Search</Label>
                <Input
                  id="framework-search"
                  name="search"
                  placeholder="Search title or publisher"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
              <FilterSelect
                label="Status"
                name="status"
                value={filters.status}
                options={STATUS_OPTIONS}
                onChange={handleFilterChange}
              />
              <div className="space-y-1 text-sm">
                <Label htmlFor="framework-jurisdiction">Jurisdiction</Label>
                <Input
                  id="framework-jurisdiction"
                  name="jurisdiction"
                  value={filters.jurisdiction}
                  onChange={handleFilterChange}
                  placeholder="e.g., US, EU"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frameworks.length ? (
                    frameworks.map((framework) => (
                      <TableRow
                        key={framework.id}
                        onClick={() => setSelectedFrameworkId(framework.id)}
                        className={`cursor-pointer ${selectedFramework?.id === framework.id ? "bg-muted/50" : ""}`}
                      >
                        <TableCell className="font-medium">
                          <div>{framework.title}</div>
                          <p className="text-xs text-muted-foreground">{framework.slug}</p>
                        </TableCell>
                        <TableCell>{framework.publisher ?? "—"}</TableCell>
                        <TableCell>{framework.jurisdiction ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{framework.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {framework.stats?.coveragePercent ?? 0}%
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {isLoading ? "Loading frameworks..." : "No frameworks match the filters."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <FrameworkForm
          key={selectedFramework?.id ?? "create"}
          initialValues={selectedFramework ?? undefined}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          submitLabel={selectedFramework ? "Update framework" : "Create framework"}
        />
      </div>
    </div>
  );
}

function FilterSelect({ label, name, value, options, onChange }) {
  return (
    <div className="space-y-1 text-sm">
      <Label htmlFor={`filter-${name}`}>{label}</Label>
      <select
        id={`filter-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value ?? "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
