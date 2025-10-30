import * as React from "react"
import {
  IconChevronDown,
  IconFilterX,
  IconLayoutColumns,
  IconRefresh,
} from "@tabler/icons-react"

import { CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { TabsList, TabsTrigger } from "@/shared/components/ui/tabs"

const DEFAULT_VIEW_OPTIONS = [
  { value: "outline", label: "Users" },
  { value: "past-performance", label: "Audit" },
  { value: "key-personnel", label: "Reports" },
]

export function UserTableHeader({
  activeView,
  onViewChange,
  viewOptions = DEFAULT_VIEW_OPTIONS,
  selectId = "view-selector",
}) {
  return (
    <CardHeader className="border-b border-border pb-6">
      <div className="flex flex-col gap-6 @4xl/main:flex-row @4xl/main:items-center @4xl/main:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">User directory</CardTitle>
          <CardDescription>
            Manage accounts, adjust roles, and review verification status across the organisation.
          </CardDescription>
        </div>
        <div className="flex w-full flex-col gap-3 @4xl/main:w-auto">
          <div className="flex flex-col gap-2 @4xl/main:hidden">
            <Label htmlFor={selectId} className="sr-only">
              View
            </Label>
            <Select value={activeView} onValueChange={onViewChange}>
              <SelectTrigger className="w-full" id={selectId} size="sm">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                {viewOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsList className="hidden **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 justify-end gap-2 @4xl/main:flex">
            {viewOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
    </CardHeader>
  )
}

export function UserTableToolbar({
  table,
  searchTerm,
  statusFilter,
  roleFilter,
  statusOptions,
  roleOptions,
  hasActiveFilters,
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onClearFilters,
  onRefresh,
  isLoading,
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex-1">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            placeholder="Search by name or email"
            size="sm"
            className="h-8 py-0 w-full lg:w-72"
            value={searchTerm}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
          <div className="flex flex-1 flex-col gap-2 items-center sm:flex-row sm:items-center">
            <Select
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              <SelectTrigger size="sm" className="h-8 py-0 w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(statusOptions ?? {}).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={onRoleFilterChange}
            >
              <SelectTrigger size="sm" className="h-8 py-0 w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Customize columns"
              title="Customize columns">
              <IconLayoutColumns />
              <span className="sr-only">Customize Columns</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
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
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
