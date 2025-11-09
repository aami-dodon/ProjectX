import { apiClient } from "@/lib/client";

export async function fetchTasks(params = {}) {
  const response = await apiClient.get("/api/tasks", { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 }, summary: {} };
}

export async function fetchTask(taskId) {
  const response = await apiClient.get(`/api/tasks/${taskId}`);
  return response?.data?.data ?? null;
}

export async function createTask(payload) {
  const response = await apiClient.post("/api/tasks", payload);
  return response?.data?.data;
}

export async function updateTask(taskId, payload) {
  const response = await apiClient.patch(`/api/tasks/${taskId}`, payload);
  return response?.data?.data;
}

export async function assignTask(taskId, payload) {
  const response = await apiClient.post(`/api/tasks/${taskId}/assignments`, payload);
  return response?.data?.data;
}

export async function attachTaskEvidence(taskId, payload) {
  const response = await apiClient.post(`/api/tasks/${taskId}/evidence`, payload);
  return response?.data?.data ?? [];
}

export async function fetchTaskTimeline(taskId, params = {}) {
  const response = await apiClient.get(`/api/tasks/${taskId}/timeline`, { params });
  return response?.data?.data ?? [];
}

export async function fetchTaskSlaMetrics() {
  const response = await apiClient.get("/api/tasks/metrics/sla");
  return response?.data?.data ?? {};
}

export async function syncTaskIntegration(taskId, payload) {
  const response = await apiClient.post(`/api/tasks/${taskId}/integrations/sync`, payload);
  return response?.data?.data ?? { status: "queued" };
}
