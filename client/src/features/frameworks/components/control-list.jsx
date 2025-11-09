import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";

const STATUS_COLORS = {
  DRAFT: "outline",
  ACTIVE: "default",
  RETIRED: "secondary",
};

const defaultControl = {
  code: "",
  title: "",
  category: "",
  riskLevel: "",
  status: "DRAFT",
  description: "",
};

export function ControlList({ controls = [], onCreate, isBusy }) {
  const [form, setForm] = useState(defaultControl);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelect = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onCreate) return;
    await onCreate({
      code: form.code,
      title: form.title,
      category: form.category || undefined,
      riskLevel: form.riskLevel || undefined,
      status: form.status,
      description: form.description || undefined,
    });
    setForm(defaultControl);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Controls ({controls.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.length ? (
                controls.map((control) => (
                  <TableRow key={control.id}>
                    <TableCell className="font-medium">{control.code}</TableCell>
                    <TableCell>{control.title}</TableCell>
                    <TableCell>{control.category ?? "—"}</TableCell>
                    <TableCell>{control.riskLevel ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[control.status] ?? "outline"}>{control.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No controls configured for this framework.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card as="form" onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Add control</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="control-code">Code</Label>
            <Input id="control-code" value={form.code} onChange={handleChange("code")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="control-title">Title</Label>
            <Input id="control-title" value={form.title} onChange={handleChange("title")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="control-category">Category</Label>
            <Input id="control-category" value={form.category} onChange={handleChange("category")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="control-risk">Risk level</Label>
            <Input id="control-risk" value={form.riskLevel} onChange={handleChange("riskLevel")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={handleSelect("status")}>
              <SelectTrigger>
                <SelectValue placeholder="Pick" />
              </SelectTrigger>
              <SelectContent>
                {["DRAFT", "ACTIVE", "RETIRED"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={handleChange("description")} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isBusy}>
            Add control
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
