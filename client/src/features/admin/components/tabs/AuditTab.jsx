import * as React from "react"

import { DataTable as SharedDataTable } from "@/shared/components/data-table"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { TabsContent } from "@/shared/components/ui/tabs"

import { useAuditLogs } from "../../hooks/use-audit-logs"
import { AuditTableToolbar } from "../audit-table/AuditTableToolbar"
import { formatDate } from "../user-table/UserTableDrawer"

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]
const ROUTINE_DATE_FIELDS = new Set([
  "lastloginat",
  "lastlogindate",
  "lastaccessedat",
  "lastaccessedtime",
  "lastaccessedon",
  "updatedat",
])

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /(^|_)(id|uuid)$/i,
  /Id$/,
]

const SENSITIVE_KEYS = new Set([
  "passwordhash",
  "mfasecret",
  "apitoken",
  "refreshtoken",
  "accesstoken",
  "id",
  "recordid",
  "userid",
  "actorid",
  "targetid",
  "sessionid",
])

const DISPLAY_PLACEHOLDER = "—"

function extractRoleName(entry) {
  if (!entry) return null
  if (typeof entry === "string") {
    const trimmed = entry.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof entry !== "object") return null
  if (typeof entry.role === "string") {
    const trimmed = entry.role.trim()
    if (trimmed.length > 0) return trimmed
  }
  if (entry.role && typeof entry.role === "object") {
    const roleName = typeof entry.role.name === "string" ? entry.role.name.trim() : ""
    if (roleName.length > 0) return roleName
  }
  if (typeof entry.roleName === "string") {
    const trimmed = entry.roleName.trim()
    if (trimmed.length > 0) return trimmed
  }
  if (typeof entry.name === "string") {
    const trimmed = entry.name.trim()
    if (trimmed.length > 0) return trimmed
  }
  return null
}

function simplifyRoleAssignments(value) {
  if (!value) return null
  const entries = Array.isArray(value) ? value : [value]
  const roleNames = entries
    .map((entry) => extractRoleName(entry))
    .filter((roleName) => typeof roleName === "string" && roleName.length > 0)
  if (roleNames.length === 0) return null
  const uniqueRoleNames = Array.from(new Set(roleNames))
  return uniqueRoleNames.length === 1 ? uniqueRoleNames[0] : uniqueRoleNames
}

function isSensitiveKey(key) {
  if (!key) return false
  const normalized = key.toLowerCase()
  if (SENSITIVE_KEYS.has(normalized)) return true
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function sanitizeSnapshot(value) {
  if (value === null || typeof value === "undefined") return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed || trimmed === DISPLAY_PLACEHOLDER) return null
    try {
      const parsed = JSON.parse(trimmed)
      return sanitizeSnapshot(parsed)
    } catch {
      return trimmed
    }
  }
  if (typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) {
    const sanitizedArray = value
      .map((entry) => sanitizeSnapshot(entry))
      .filter((entry) => {
        if (entry === null || typeof entry === "undefined") return false
        if (typeof entry === "string") return entry.length > 0
        if (typeof entry === "object" && !Array.isArray(entry))
          return Object.keys(entry).length > 0
        if (Array.isArray(entry)) return entry.length > 0
        return true
      })
    return sanitizedArray.length > 0 ? sanitizedArray : null
  }
  if (typeof value === "object") {
    const sanitizedEntries = Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, entryValue]) => {
        const sanitizedValue = sanitizeSnapshot(entryValue)
        if (key && key.toLowerCase() === "roleassignments") {
          const simplified = simplifyRoleAssignments(sanitizedValue)
          if (!simplified) return null
          return ["role", simplified]
        }
        return [key, sanitizedValue]
      })
      .filter(Boolean)
      .filter(([, entryValue]) => {
        if (entryValue === null || typeof entryValue === "undefined") return false
        if (typeof entryValue === "string") return entryValue.length > 0
        if (Array.isArray(entryValue)) return entryValue.length > 0
        if (typeof entryValue === "object") return Object.keys(entryValue).length > 0
        return true
      })
    if (!sanitizedEntries.length) return null
    return sanitizedEntries.reduce((acc, [key, entryValue]) => {
      acc[key] = entryValue
      return acc
    }, {})
  }
  return value
}

function formatReadableValue(value) {
  if (value === null || typeof value === "undefined") return null
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return `${value}`
  if (Array.isArray(value)) {
    const formattedItems = value
      .map((item) => formatReadableValue(item))
      .filter((item) => typeof item === "string" && item.length > 0)
    return formattedItems.length > 0 ? formattedItems.join(", ") : null
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, entryValue]) => {
        const formatted = formatReadableValue(entryValue)
        if (!formatted) return null
        return `${key}: ${formatted}`
      })
      .filter(Boolean)
    return entries.length > 0 ? entries.join(", ") : null
  }
  return `${value}`
}

function sanitizeChangeValue(value) {
  if (value === null || typeof value === "undefined") return null
  if (typeof value !== "string") return sanitizeSnapshot(value)
  const trimmed = value.trim()
  if (!trimmed || trimmed === DISPLAY_PLACEHOLDER) return null
  return sanitizeSnapshot(trimmed)
}

function formatChangeValue(value) {
  if (value === null || typeof value === "undefined") return DISPLAY_PLACEHOLDER
  const formatted = formatReadableValue(value)
  return formatted ?? DISPLAY_PLACEHOLDER
}

function normalizeChangeEntries(changeEntries) {
  if (!Array.isArray(changeEntries)) return []
  return changeEntries
    .map((entry) => {
      if (typeof entry !== "string") return null
      const separatorIndex = entry.indexOf(":")
      if (separatorIndex === -1) {
        const formattedValue = formatChangeValue(sanitizeChangeValue(entry))
        return formattedValue === DISPLAY_PLACEHOLDER ? null : formattedValue
      }
      const field = entry.slice(0, separatorIndex).trim()
      const rawValues = entry.slice(separatorIndex + 1)
      const arrowIndex = rawValues.indexOf("->")
      if (arrowIndex === -1) return entry.trim()
      const rawPrevious = rawValues.slice(0, arrowIndex)
      const rawNext = rawValues.slice(arrowIndex + 2)
      const previousSanitized = sanitizeChangeValue(rawPrevious)
      const nextSanitized = sanitizeChangeValue(rawNext)
      const lowerField = field.toLowerCase()
      let displayField = field
      let previousValue = previousSanitized
      let nextValue = nextSanitized
      if (lowerField === "roleassignments") {
        displayField = "role"
        const simplifiedPrevious = simplifyRoleAssignments(previousSanitized)
        const simplifiedNext = simplifyRoleAssignments(nextSanitized)
        if (simplifiedPrevious !== null && typeof simplifiedPrevious !== "undefined")
          previousValue = simplifiedPrevious
        if (simplifiedNext !== null && typeof simplifiedNext !== "undefined")
          nextValue = simplifiedNext
      }
      const previousFormatted = formatChangeValue(previousValue)
      const nextFormatted = formatChangeValue(nextValue)
      if (
        previousFormatted === DISPLAY_PLACEHOLDER &&
        nextFormatted === DISPLAY_PLACEHOLDER
      )
        return null
      return `${displayField}: ${previousFormatted} -> ${nextFormatted}`
    })
    .filter((entry) => typeof entry === "string" && entry.trim().length > 0)
}

function snapshotToEntries(value) {
  if (value === null || typeof value === "undefined") return []
  if (Array.isArray(value) || typeof value !== "object") {
    const formatted = formatReadableValue(value)
    return formatted ? [{ key: "value", value: formatted }] : []
  }
  return Object.entries(value)
    .map(([key, entryValue]) => {
      const formatted = formatReadableValue(entryValue)
      if (!formatted) return null
      return { key, value: formatted }
    })
    .filter(Boolean)
}

function createChangeSet(before, after) {
  const beforeEntries = snapshotToEntries(before)
  const afterEntries = snapshotToEntries(after)
  const beforeMap = new Map(beforeEntries.map(({ key, value }) => [key, value]))
  const afterMap = new Map(afterEntries.map(({ key, value }) => [key, value]))
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()])
  return Array.from(keys).reduce((changes, key) => {
    const normalizedKey = typeof key === "string" ? key : `${key}`
    const comparableKey = normalizedKey.replace(/[^a-z0-9]/gi, "").toLowerCase()
    if (ROUTINE_DATE_FIELDS.has(comparableKey)) return changes
    const previous = beforeMap.get(key)
    const next = afterMap.get(key)
    if ((previous ?? "") === (next ?? "")) return changes
    changes.push({
      field: normalizedKey === "value" ? "Value" : normalizedKey,
      previous: previous ?? "—",
      next: next ?? "—",
    })
    return changes
  }, [])
}

function buildPersonLabel(user) {
  const fullName = user?.fullName?.trim()
  if (fullName) return fullName
  return null
}

function resolveAffectedUserLabel(log) {
  const label = buildPersonLabel(log?.affectedUser)
  if (label) return label
  if (log?.affectedUserId) return "User account"
  return "—"
}

function resolveModifiedByLabel(log) {
  const label = buildPersonLabel(log?.performedBy)
  if (label) return label
  if (log?.performedById) return "User account"
  return "System"
}

function prepareAuditRow(log) {
  const sanitizedBefore = sanitizeSnapshot(log?.before)
  const sanitizedAfter = sanitizeSnapshot(log?.after)
  const changeEntries = Array.isArray(log?.changes)
    ? log.changes.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
    : []
  const normalizedChanges =
    changeEntries.length > 0 ? normalizeChangeEntries(changeEntries) : []
  const computedChanges =
    normalizedChanges.length > 0
      ? normalizedChanges
      : createChangeSet(sanitizedBefore, sanitizedAfter).map(
          (change) => `${change.field}: ${change.previous} -> ${change.next}`
        )
  return {
    id: log?.id ?? null,
    action: log?.action ?? "—",
    model: log?.model ?? "—",
    changes: computedChanges,
    affectedUserLabel: resolveAffectedUserLabel(log),
    modifiedByLabel: resolveModifiedByLabel(log),
    timestamp: log?.timestamp ?? log?.createdAt ?? null,
  }
}

function AuditActionCell({ log }) {
  return (
    <div className="flex flex-col text-sm">
      <span className="font-semibold uppercase tracking-wide text-foreground">
        {log.action ?? "—"}
      </span>
    </div>
  )
}

export function AuditTab() {
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState({
    startDate: null,
    endDate: null,
    key: "selection",
  })

  const {
    logs: auditLogs,
    total: auditTotal,
    isLoading: isLoadingAuditLogs,
    error: auditLogsError,
    refresh: refreshAuditLogs,
  } = useAuditLogs({
    model: "AuthUser",
    limit: pageSize,
    offset: pageIndex * pageSize,
    searchTerm,
    action: actionFilter === "all" ? null : actionFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  const preparedLogs = React.useMemo(
    () => (Array.isArray(auditLogs) ? auditLogs : []).map((log) => prepareAuditRow(log)),
    [auditLogs]
  )

  const auditColumns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "action",
        header: "Action Performed",
        meta: {
          columnLabel: "Action Performed",
          headerClassName: "w-56",
          cellClassName: "align-top",
        },
        cell: ({ row }) => <AuditActionCell log={row.original} />,
      },
      {
        accessorKey: "changes",
        header: "Changes",
        meta: {
          columnLabel: "Changes",
          headerClassName: "w-[26rem]",
          cellClassName: "align-top",
        },
        cell: ({ row }) => (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {Array.isArray(row.original.changes) && row.original.changes.length > 0 ? (
              row.original.changes.map((change, index) => (
                <li key={`${change}-${index}`} className="leading-5">
                  {change}
                </li>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </ul>
        ),
      },
      {
        accessorKey: "affectedUserLabel",
        header: "User",
        meta: {
          columnLabel: "User",
          cellClassName: "align-top",
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.affectedUserLabel}
          </span>
        ),
      },
      {
        accessorKey: "modifiedByLabel",
        header: "Modified By",
        meta: {
          columnLabel: "Modified By",
          cellClassName: "align-top",
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.modifiedByLabel}
          </span>
        ),
      },
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        meta: {
          columnLabel: "Timestamp",
          headerClassName: "w-48",
          cellClassName: "align-top",
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.timestamp)}
          </span>
        ),
      },
    ],
    []
  )

  const handlePaginationChange = React.useCallback(
    (next) => {
      if (!next) return
      const nextPageSize = next.pageSize ?? pageSize
      const nextPageIndex = next.pageIndex ?? pageIndex
      if (nextPageSize !== pageSize) {
        setPageSize(nextPageSize)
        setPageIndex(0)
        return
      }
      if (nextPageIndex !== pageIndex) {
        setPageIndex(Math.max(0, nextPageIndex))
      }
    },
    [pageIndex, pageSize]
  )

  const totalPages = React.useMemo(() => {
    const safePageSize = Math.max(pageSize, 1)
    const safeTotal = Math.max(auditTotal ?? 0, 0)
    return Math.max(1, Math.ceil(safeTotal / safePageSize))
  }, [auditTotal, pageSize])

  const hasActiveFilters = React.useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      actionFilter !== "all" ||
      dateRange.startDate ||
      dateRange.endDate
    )
  }, [searchTerm, actionFilter, dateRange])

  const handleClearFilters = React.useCallback(() => {
    setSearchTerm("")
    setActionFilter("all")
    setDateRange({
      startDate: null,
      endDate: null,
      key: "selection",
    })
  }, [])

  return (
    <TabsContent value="audit" className="mt-0 flex flex-col gap-4">
      <SharedDataTable
        title="Auth user audit trail"
        description="Review recent changes captured for account updates."
        columns={auditColumns}
        data={preparedLogs}
        className="flex flex-1 flex-col gap-4"
        isLoading={isLoadingAuditLogs}
        error={auditLogsError}
        emptyMessage={
          hasActiveFilters
            ? "No audit activity found for the selected filters."
            : "No audit activity recorded for AuthUser yet."
        }
        onRefresh={() => refreshAuditLogs({ withLoading: true })}
        enablePagination
        manualPagination
        manualFiltering
        stickyHeader
        skeletonRowCount={4}
        totalItems={auditTotal ?? 0}
        paginationState={{ pageIndex, pageSize }}
        pageCount={totalPages}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPaginationChange={handlePaginationChange}
        enableRowSelection
        renderHeader={({ table }) => (
          <AuditTableToolbar
            table={table}
            searchTerm={searchTerm}
            actionFilter={actionFilter}
            dateRange={dateRange}
            hasActiveFilters={hasActiveFilters}
            onSearchChange={setSearchTerm}
            onActionFilterChange={setActionFilter}
            onDateRangeChange={setDateRange}
            onClearFilters={handleClearFilters}
            onRefresh={() => refreshAuditLogs({ withLoading: true })}
            isLoading={isLoadingAuditLogs}
          />
        )}
        getRowId={(row, index) =>
          row?.id ? `${row.id}` : `${row?.timestamp ?? "audit"}-${index}`
        }
      />
    </TabsContent>
  )
}
