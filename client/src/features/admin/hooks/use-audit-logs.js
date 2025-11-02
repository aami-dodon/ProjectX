import { useCallback, useEffect, useState } from "react"

import { apiClient } from "@/shared/lib/client"

export function useAuditLogs({ model, limit, offset } = {}) {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [meta, setMeta] = useState({ limit: limit ?? 0, offset: offset ?? 0 })

  const fetchLogs = useCallback(
    async ({ withLoading = true } = {}) => {
      if (withLoading) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const params = {}
        if (typeof limit === "number" && Number.isFinite(limit)) {
          params.limit = limit
        }
        if (typeof offset === "number" && Number.isFinite(offset)) {
          params.offset = offset
        }
        if (typeof model === "string" && model.trim()) {
          params.model = model.trim()
        }

        const { data } = await apiClient.get("/api/audit", { params })
        const resolvedLogs = Array.isArray(data?.logs) ? data.logs : []
        setLogs(resolvedLogs)
        setTotal(typeof data?.total === "number" ? data.total : resolvedLogs.length)
        setMeta({
          limit:
            typeof data?.limit === "number" && Number.isFinite(data.limit)
              ? data.limit
              : typeof limit === "number"
                ? limit
                : resolvedLogs.length,
          offset:
            typeof data?.offset === "number" && Number.isFinite(data.offset)
              ? data.offset
              : typeof offset === "number"
                ? offset
                : 0,
        })
      } catch (err) {
        const message = err?.message ?? "Unable to load audit logs"
        setError({ message })
        setLogs([])
        setTotal(0)
        setMeta({
          limit: typeof limit === "number" ? limit : 0,
          offset: typeof offset === "number" ? offset : 0,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [limit, model, offset]
  )

  useEffect(() => {
    fetchLogs({ withLoading: true })
  }, [fetchLogs])

  const refresh = useCallback((options) => fetchLogs(options), [fetchLogs])

  return {
    logs,
    total,
    limit: meta.limit,
    offset: meta.offset,
    isLoading,
    error,
    refresh,
  }
}
