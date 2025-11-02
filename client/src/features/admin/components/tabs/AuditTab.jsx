import * as React from "react"

import { DataTable as SharedDataTable } from "@/shared/components/data-table"
import { TabsContent } from "@/shared/components/ui/tabs"

import { useAuditLogs } from "../../hooks/use-audit-logs"
import { formatDate } from "../user-table/UserTableDrawer"

function formatAuditSnapshot(value) {
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
      return formatAuditSnapshot(parsed)
    } catch {
      return trimmed
    }
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`
  }

  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return `${value}`
    }
  }

  return `${value}`
}

export function AuditTab() {
  const {
    logs: auditLogs,
    isLoading: isLoadingAuditLogs,
    error: auditLogsError,
    refresh: refreshAuditLogs,
  } = useAuditLogs({ model: "AuthUser", limit: 100 })

  const auditColumns = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        meta: {
          columnLabel: "Timestamp",
          headerClassName: "w-48",
          cellClassName: "align-top",
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: "event",
        header: "Event",
        meta: {
          columnLabel: "Event",
          cellClassName: "align-top",
        },
        cell: ({ row }) => {
          const { action, model, recordId, userId, ip, userAgent } = row.original
          const primaryDetails = [model, recordId ? `Record ${recordId}` : null].filter(Boolean)
          const secondaryDetails = [
            userId ? `Actor ${userId}` : null,
            ip ? `IP ${ip}` : null,
          ].filter(Boolean)

          return (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{action ?? "—"}</span>
              {primaryDetails.length ? (
                <span className="text-muted-foreground">{primaryDetails.join(" • ")}</span>
              ) : null}
              {secondaryDetails.length ? (
                <span className="text-muted-foreground text-xs">
                  {secondaryDetails.join(" • ")}
                </span>
              ) : null}
              {userAgent ? (
                <span className="text-muted-foreground text-xs break-words">{userAgent}</span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "before",
        header: "Before",
        meta: {
          columnLabel: "Before",
          cellClassName: "align-top",
        },
        cell: ({ row }) => {
          const formatted = formatAuditSnapshot(row.original.before)

          return formatted ? (
            <pre className="bg-muted/40 text-xs text-muted-foreground whitespace-pre-wrap break-words rounded-md p-2 max-h-40 overflow-auto">
              {formatted}
            </pre>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
      {
        id: "after",
        header: "After",
        meta: {
          columnLabel: "After",
          cellClassName: "align-top",
        },
        cell: ({ row }) => {
          const formatted = formatAuditSnapshot(row.original.after)

          return formatted ? (
            <pre className="bg-muted/40 text-xs text-muted-foreground whitespace-pre-wrap break-words rounded-md p-2 max-h-40 overflow-auto">
              {formatted}
            </pre>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
    ],
    []
  )

  return (
    <TabsContent value="audit" className="mt-0 flex flex-col">
      <SharedDataTable
        title="Auth user audit trail"
        description="Review recent changes captured for account updates."
        columns={auditColumns}
        data={auditLogs}
        className="flex flex-1 flex-col"
        isLoading={isLoadingAuditLogs}
        error={auditLogsError}
        emptyMessage="No audit activity recorded for AuthUser yet."
        onRefresh={refreshAuditLogs}
        enablePagination
        stickyHeader
        skeletonRowCount={4}
        getRowId={(row, index) =>
          row?.id ? `${row.id}` : `${row?.createdAt ?? "audit"}-${index}`
        }
      />
    </TabsContent>
  )
}
