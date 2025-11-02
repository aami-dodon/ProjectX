import * as React from "react"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

import { DataTable as SharedDataTable } from "@/shared/components/data-table"
import { Button } from "@/shared/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import { TabsContent } from "@/shared/components/ui/tabs"

import { useAuditLogs } from "../../hooks/use-audit-logs"
import { formatDate } from "../user-table/UserTableDrawer"

const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

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

function isSensitiveKey(key) {
  if (!key) {
    return false
  }

  const normalized = key.toLowerCase()
  if (SENSITIVE_KEYS.has(normalized)) {
    return true
  }

  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function sanitizeSnapshot(value) {
  if (value === null || typeof value === "undefined") {
    return null
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    try {
      const parsed = JSON.parse(trimmed)
      return sanitizeSnapshot(parsed)
    } catch {
      return trimmed
    }
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .map((entry) => sanitizeSnapshot(entry))
      .filter((entry) => {
        if (entry === null || typeof entry === "undefined") {
          return false
        }
        if (typeof entry === "string") {
          return entry.length > 0
        }
        if (typeof entry === "object" && !Array.isArray(entry)) {
          return Object.keys(entry).length > 0
        }
        if (Array.isArray(entry)) {
          return entry.length > 0
        }
        return true
      })

    return sanitizedArray.length > 0 ? sanitizedArray : null
  }

  if (typeof value === "object") {
    const sanitizedEntries = Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, entryValue]) => [key, sanitizeSnapshot(entryValue)])
      .filter(([, entryValue]) => {
        if (entryValue === null || typeof entryValue === "undefined") {
          return false
        }
        if (typeof entryValue === "string") {
          return entryValue.length > 0
        }
        if (Array.isArray(entryValue)) {
          return entryValue.length > 0
        }
        if (typeof entryValue === "object") {
          return Object.keys(entryValue).length > 0
        }
        return true
      })

    if (!sanitizedEntries.length) {
      return null
    }

    return sanitizedEntries.reduce((accumulator, [key, entryValue]) => {
      accumulator[key] = entryValue
      return accumulator
    }, {})
  }

  return value
}

function formatReadableValue(value) {
  if (value === null || typeof value === "undefined") {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`
  }

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
        if (!formatted) {
          return null
        }
        return `${key}: ${formatted}`
      })
      .filter(Boolean)

    return entries.length > 0 ? entries.join(", ") : null
  }

  return `${value}`
}

function snapshotToEntries(value) {
  if (value === null || typeof value === "undefined") {
    return []
  }

  if (Array.isArray(value) || typeof value !== "object") {
    const formatted = formatReadableValue(value)
    return formatted ? [{ key: "value", value: formatted }] : []
  }

  return Object.entries(value)
    .map(([key, entryValue]) => {
      const formatted = formatReadableValue(entryValue)
      if (!formatted) {
        return null
      }

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
    const previous = beforeMap.get(key)
    const next = afterMap.get(key)

    if ((previous ?? "") === (next ?? "")) {
      return changes
    }

    changes.push({
      field: key === "value" ? "Value" : key,
      previous: previous ?? "—",
      next: next ?? "—",
    })
    return changes
  }, [])
}

function formatTableLabel(model) {
  if (!model) {
    return "—"
  }

  const spaced = model.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  return spaced.toLowerCase()
}

function buildUserLabel(log) {
  const fullName = log?.user?.fullName?.trim()
  const email = log?.user?.email?.trim()

  if (fullName && email) {
    return `${fullName} (${email})`
  }

  if (fullName) {
    return fullName
  }

  if (email) {
    return email
  }

  return log?.userId ? "User account" : "System"
}

function buildContext(log) {
  return [
    log?.ip ? `IP: ${log.ip}` : null,
    log?.userAgent ? `User agent: ${log.userAgent}` : null,
  ].filter(Boolean)
}

function prepareAuditRow(log) {
  const sanitizedBefore = sanitizeSnapshot(log?.before)
  const sanitizedAfter = sanitizeSnapshot(log?.after)

  return {
    id: log?.id ?? null,
    action: log?.action ?? "—",
    model: log?.model ?? "—",
    tableLabel: formatTableLabel(log?.model),
    userLabel: buildUserLabel(log),
    createdAt: log?.createdAt ?? null,
    changes: createChangeSet(sanitizedBefore, sanitizedAfter),
    context: buildContext(log),
    beforeSummary: formatReadableValue(sanitizedBefore),
    afterSummary: formatReadableValue(sanitizedAfter),
  }
}

function AuditDetails({ log }) {
  const [open, setOpen] = React.useState(false)
  const hasChanges = Array.isArray(log?.changes) && log.changes.length > 0
  const contextEntries = Array.isArray(log?.context) ? log.context : []
  const hasContext = contextEntries.length > 0
  const hasSnapshots = Boolean(log?.beforeSummary || log?.afterSummary)

  if (!hasChanges && !hasContext && !hasSnapshots) {
    return null
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="text-xs">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-fit px-2 text-xs font-medium text-muted-foreground"
        >
          {open ? (
            <>
              <IconChevronUp className="size-3" />
              Hide details
            </>
          ) : (
            <>
              <IconChevronDown className="size-3" />
              View details
            </>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3">
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Changes
          </span>
          {hasChanges ? (
            <ul className="space-y-1">
              {log.changes.map((change, index) => (
                <li key={`${change.field}-${index}`} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{change.field}:</span>{" "}
                  <span>{change.previous}</span>
                  <span className="mx-1" aria-hidden="true">
                    →
                  </span>
                  <span>{change.next}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No field-level changes captured.</p>
          )}
        </div>
        {hasSnapshots ? (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Snapshots
            </span>
            {log.beforeSummary ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Before:</span>{" "}
                {log.beforeSummary}
              </div>
            ) : null}
            {log.afterSummary ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">After:</span>{" "}
                {log.afterSummary}
              </div>
            ) : null}
          </div>
        ) : null}
        {hasContext ? (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Context
            </span>
            <ul className="space-y-1">
              {contextEntries.map((entry, index) => (
                <li key={`${entry}-${index}`} className="text-xs text-muted-foreground">
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

function AuditActionCell({ log }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-semibold uppercase tracking-wide text-foreground">
        {log.action ?? "—"}
      </span>
      <AuditDetails log={log} />
    </div>
  )
}

function AuditTableCell({ log }) {
  return <span className="text-sm text-muted-foreground">{log.tableLabel}</span>
}

function AuditUserCell({ log }) {
  return <span className="text-sm text-muted-foreground">{log.userLabel}</span>
}

function AuditTimestampCell({ log }) {
  if (!log.createdAt) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <span className="text-sm text-muted-foreground">
      {formatDate(log.createdAt)}
    </span>
  )
}

export function AuditTab() {
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE)

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
  })

  const preparedLogs = React.useMemo(
    () => (Array.isArray(auditLogs) ? auditLogs : []).map((log) => prepareAuditRow(log)),
    [auditLogs]
  )

  const auditColumns = React.useMemo(
    () => [
      {
        accessorKey: "action",
        header: "Action",
        meta: {
          columnLabel: "Action",
          headerClassName: "w-56",
          cellClassName: "align-top",
        },
        cell: ({ row }) => <AuditActionCell log={row.original} />,
      },
      {
        accessorKey: "tableLabel",
        header: "Table",
        meta: {
          columnLabel: "Table",
          headerClassName: "w-40",
          cellClassName: "align-top",
        },
        cell: ({ row }) => <AuditTableCell log={row.original} />,
      },
      {
        accessorKey: "userLabel",
        header: "User",
        meta: {
          columnLabel: "User",
          cellClassName: "align-top",
        },
        cell: ({ row }) => <AuditUserCell log={row.original} />,
      },
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        meta: {
          columnLabel: "Timestamp",
          headerClassName: "w-48",
          cellClassName: "align-top",
        },
        cell: ({ row }) => <AuditTimestampCell log={row.original} />,
      },
    ],
    []
  )

  const handlePaginationChange = React.useCallback(
    (next) => {
      if (!next) {
        return
      }

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

  return (
    <TabsContent value="audit" className="mt-0 flex flex-col">
      <SharedDataTable
        title="Auth user audit trail"
        description="Review recent changes captured for account updates."
        columns={auditColumns}
        data={preparedLogs}
        className="flex flex-1 flex-col"
        isLoading={isLoadingAuditLogs}
        error={auditLogsError}
        emptyMessage="No audit activity recorded for AuthUser yet."
        onRefresh={() => refreshAuditLogs({ withLoading: true })}
        enablePagination
        manualPagination
        stickyHeader
        skeletonRowCount={4}
        totalItems={auditTotal ?? 0}
        paginationState={{
          pageIndex,
          pageSize,
        }}
        pageCount={totalPages}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPaginationChange={handlePaginationChange}
        getRowId={(row, index) =>
          row?.id ? `${row.id}` : `${row?.createdAt ?? "audit"}-${index}`
        }
      />
    </TabsContent>
  )
}
