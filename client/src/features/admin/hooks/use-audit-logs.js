import { useCallback, useEffect, useState } from "react"

import { apiClient } from "@/shared/lib/client"

export function useAuditLogs({ model, limit } = {}) {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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

        const { data } = await apiClient.get("/api/audit", { params })
        const rawLogs = Array.isArray(data?.logs) ? data.logs : []
        const filteredLogs = model
          ? rawLogs.filter((log) => log?.model === model)
          : rawLogs

        setLogs(filteredLogs)
      } catch (err) {
        const message = err?.message ?? "Unable to load audit logs"
        setError({ message })
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    },
    [limit, model]
  )

  useEffect(() => {
    fetchLogs({ withLoading: true })
  }, [fetchLogs])

  const refresh = useCallback((options) => fetchLogs(options), [fetchLogs])

  return {
    logs,
    isLoading,
    error,
    refresh,
  }
}
