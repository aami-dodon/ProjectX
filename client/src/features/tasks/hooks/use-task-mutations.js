import { useCallback, useState } from "react";

import {
  assignTask,
  attachTaskEvidence,
  createTask,
  syncTaskIntegration,
  updateTask,
} from "@/features/tasks/api/tasks-client";

export function useTaskMutations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const runMutation = useCallback(async (action, fn) => {
    setIsSubmitting(true);
    setLastError(null);
    setLastAction(action);
    try {
      return await fn();
    } catch (error) {
      setLastError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    lastError,
    lastAction,
    createTask: useCallback((payload) => runMutation("create", () => createTask(payload)), [runMutation]),
    updateTask: useCallback((taskId, payload) => runMutation("update", () => updateTask(taskId, payload)), [runMutation]),
    assignTask: useCallback((taskId, payload) => runMutation("assign", () => assignTask(taskId, payload)), [runMutation]),
    attachEvidence: useCallback(
      (taskId, payload) => runMutation("attach-evidence", () => attachTaskEvidence(taskId, payload)),
      [runMutation],
    ),
    syncTask: useCallback(
      (taskId, payload) => runMutation("sync", () => syncTaskIntegration(taskId, payload)),
      [runMutation],
    ),
  };
}
