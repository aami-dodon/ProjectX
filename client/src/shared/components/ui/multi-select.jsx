import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

export function MultiSelect({
  label,
  description,
  value = [],
  options = [],
  onChange,
  placeholder = "Select options",
  searchPlaceholder = "Search options",
  emptyText = "No options found.",
  isLoading = false,
  getOptionValue = (option) => option.value ?? option.id,
  getOptionLabel = (option) => option.label ?? option.name ?? option.title ?? option.id,
  getOptionDescription,
  badgeVariant = "outline",
  buttonClassName,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const safeValue = Array.isArray(value) ? value : [];

  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return options;
    }
    const term = search.trim().toLowerCase();
    return options.filter((option) => {
      const labelText = `${getOptionLabel(option) ?? ""}`.toLowerCase();
      if (labelText.includes(term)) {
        return true;
      }
      const descriptionText = getOptionDescription ? `${getOptionDescription(option) ?? ""}`.toLowerCase() : "";
      return descriptionText.includes(term);
    });
  }, [getOptionDescription, getOptionLabel, options, search]);

  const toggleValue = (nextValue) => {
    if (!nextValue) {
      return;
    }
    const nextSelection = safeValue.includes(nextValue)
      ? safeValue.filter((item) => item !== nextValue)
      : [...safeValue, nextValue];
    onChange?.(nextSelection);
  };

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className={cn("w-full justify-between", buttonClassName)}>
            <span>
              {isLoading ? "Loading…" : safeValue.length ? `${safeValue.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0">
          <div className="border-b p-2">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-64 p-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading options…</p>
            ) : filteredOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const optionDescription = getOptionDescription?.(option);
                return (
                  <label
                    key={optionValue}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-left hover:bg-muted"
                  >
                    <Checkbox
                      checked={safeValue.includes(optionValue)}
                      onCheckedChange={() => toggleValue(optionValue)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{optionLabel}</p>
                      {optionDescription ? (
                        <p className="text-xs text-muted-foreground">{optionDescription}</p>
                      ) : null}
                    </div>
                  </label>
                );
              })
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {safeValue.length ? (
        <div className="flex flex-wrap gap-1">
          {safeValue.map((selected) => {
            const option = options.find((opt) => getOptionValue(opt) === selected);
            const labelText = option ? getOptionLabel(option) : selected;
            return (
              <Badge key={selected} variant={badgeVariant}>
                {labelText}
              </Badge>
            );
          })}
        </div>
      ) : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
