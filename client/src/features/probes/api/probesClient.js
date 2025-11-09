import { apiClient } from "@/lib/client";

export async function fetchProbes(params = {}) {
  const response = await apiClient.get("/api/probes", { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 } };
}

export async function createProbe(payload) {
  const response = await apiClient.post("/api/probes", payload);
  return response?.data?.data;
}

export async function fetchProbe(probeId) {
  const response = await apiClient.get(`/api/probes/${probeId}`);
  return response?.data?.data;
}

export async function fetchDeployments(probeId) {
  const response = await apiClient.get(`/api/probes/${probeId}/deployments`);
  return response?.data?.data ?? [];
}

export async function createDeployment(probeId, payload) {
  const response = await apiClient.post(`/api/probes/${probeId}/deployments`, payload);
  return response?.data?.data;
}

export async function fetchSchedules(probeId) {
  const response = await apiClient.get(`/api/probes/${probeId}/schedules`);
  return response?.data?.data ?? [];
}

export async function createSchedule(probeId, payload) {
  const response = await apiClient.post(`/api/probes/${probeId}/schedules`, payload);
  return response?.data?.data;
}

export async function triggerProbeRun(probeId, payload) {
  const response = await apiClient.post(`/api/probes/${probeId}/run`, payload);
  return response?.data;
}

export async function fetchProbeMetrics(probeId) {
  const response = await apiClient.get(`/api/probes/${probeId}/metrics`);
  return response?.data?.data;
}
