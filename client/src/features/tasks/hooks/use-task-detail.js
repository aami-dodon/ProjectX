import { useCallback, useEffect, useState } from "react";

import { fetchTask, fetchTaskTimeline } from "@/features/tasks/api/tasks-client";

export function useTaskDetail(taskId) {
  const [task, setTask] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setTimeline([]);
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [detail, events] = await Promise.all([fetchTask(taskId), fetchTaskTimeline(taskId)]);
      setTask(detail);
      setTimeline(events ?? []);
      return detail;
    } catch (err) {
      setTask(null);
      setTimeline([]);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const refreshTimeline = useCallback(async () => {
    if (!taskId) {
      return [];
    }

    const events = await fetchTaskTimeline(taskId);
    setTimeline(events ?? []);
    return events;
  }, [taskId]);

  return {
    task,
    timeline,
    isLoading,
    error,
    refresh: load,
    refreshTimeline,
  };
}
