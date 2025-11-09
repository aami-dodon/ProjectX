import { useMemo, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const EXPORT_TYPE_LABELS = {
  FRAMEWORK_ATTESTATION: "Framework attestation",
  CONTROL_BREAKDOWN: "Control breakdown",
  REMEDIATION_DIGEST: "Remediation digest",
  EVIDENCE_OVERVIEW: "Evidence overview",
};

const EXPORT_FORMATS = ["JSON", "CSV", "XLSX"];

export function ExportSchedulerModal({ open, onOpenChange, onSubmit, isSubmitting = false, defaultFilters = {} }) {
  const [exportType, setExportType] = useState("FRAMEWORK_ATTESTATION");
  const [format, setFormat] = useState("JSON");
  const [filtersText, setFiltersText] = useState(() =>
    Object.keys(defaultFilters).length ? JSON.stringify(defaultFilters, null, 2) : ""
  );
  const [scheduleCron, setScheduleCron] = useState("daily 02:00");
  const [parseError, setParseError] = useState(null);

  const filterPlaceholder = useMemo(
    () =>
      JSON.stringify(
        {
          frameworkIds: ["framework-id"],
          domain: "Security",
          windowDays: 30,
        },
        null,
        2
      ),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setParseError(null);
    try {
      const parsedFilters = filtersText.trim() ? JSON.parse(filtersText) : {};
      onSubmit?.({ exportType, format, filters: parsedFilters, schedule: { expression: scheduleCron } });
    } catch (error) {
      setParseError(error.message);
    }
  };

  const handleOpenChange = (next) => {
    if (!next) {
      setParseError(null);
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule export</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Export type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPORT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filters">Filters (JSON)</Label>
            <Textarea
              id="filters"
              value={filtersText}
              onChange={(event) => setFiltersText(event.target.value)}
              placeholder={filterPlaceholder}
              className="font-mono"
              rows={6}
            />
            {parseError && <p className="text-xs text-destructive">{parseError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule label</Label>
            <Input
              id="schedule"
              value={scheduleCron}
              onChange={(event) => setScheduleCron(event.target.value)}
              placeholder="daily 02:00"
            />
            <p className="text-xs text-muted-foreground">Describe cadence for runbooks (optional).</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Scheduling..." : "Schedule export"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
