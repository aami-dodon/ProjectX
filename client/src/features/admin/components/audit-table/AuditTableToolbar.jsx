import * as React from "react"
import { format } from "date-fns"
import { IconFilterX, IconLayoutColumns, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { Calendar } from "@/shared/components/ui/calendar"

const AUDIT_ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
]

export function AuditTableToolbar({
  table,
  searchTerm,
  actionFilter,
  dateRange,
  hasActiveFilters,
  onSearchChange,
  onActionFilterChange,
  onDateRangeChange,
  onClearFilters,
  onRefresh,
  isLoading,
}) {
  const [open, setOpen] = React.useState(false)

  const handleRangeSelect = (range) => {
    if (!range?.from || !range?.to) return
    onDateRangeChange({
      startDate: range.from,
      endDate: range.to,
    })
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex-1">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            placeholder="Search by user or action"
            size="sm"
            className="h-8 py-0 w-full lg:w-72"
            value={searchTerm}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />

          <div className="flex flex-1 flex-col gap-2 items-center sm:flex-row sm:items-center">
            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={onActionFilterChange}>
              <SelectTrigger size="sm" className="h-8 py-0 w-full sm:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 py-0 min-w-[10rem] max-w-full justify-between text-left font-normal"
                >
                  {dateRange.startDate && dateRange.endDate ? (
                    <>
                      {format(dateRange.startDate, "LLL dd, y")} -{" "}
                      {format(dateRange.endDate, "LLL dd, y")}
                    </>
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={{
                    from: dateRange.startDate,
                    to: dateRange.endDate,
                  }}
                  onSelect={handleRangeSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="w-auto"
              disabled={!hasActiveFilters}
              onClick={onClearFilters}
              aria-label="Clear filters"
              title="Clear filters"
            >
              <IconFilterX className="size-4" aria-hidden="true" />
              <span className="sr-only">Clear filters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Column toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Customize columns"
              title="Customize columns"
            >
              <IconLayoutColumns />
              <span className="sr-only">Customize Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column) => {
                const label =
                  column.columnDef?.meta?.columnLabel ??
                  (typeof column.columnDef?.header === "string"
                    ? column.columnDef.header
                    : column.id)

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh */}
        {onRefresh ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh table"
          >
            <IconRefresh className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
