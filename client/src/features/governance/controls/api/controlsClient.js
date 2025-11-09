import { apiClient } from "@/shared/lib/client";

export async function fetchControls(params = {}) {
  const response = await apiClient.get("/api/governance/controls", { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 }, summary: {} };
}

export async function createControl(payload) {
  const response = await apiClient.post("/api/governance/controls", payload);
  return response?.data?.data;
}

export async function getControl(controlId) {
  const response = await apiClient.get(`/api/governance/controls/${controlId}`);
  return response?.data?.data;
}

export async function updateControl(controlId, payload) {
  const response = await apiClient.patch(`/api/governance/controls/${controlId}`, payload);
  return response?.data?.data;
}

export async function archiveControl(controlId, payload) {
  const response = await apiClient.post(`/api/governance/controls/${controlId}/archive`, payload);
  return response?.data?.data;
}

export async function replaceControlMappings(controlId, payload) {
  const response = await apiClient.put(`/api/governance/controls/${controlId}/mappings`, payload);
  return response?.data?.data;
}

export async function fetchControlScores(controlId, params = {}) {
  const response = await apiClient.get(`/api/governance/controls/${controlId}/scores`, { params });
  return response?.data?.data ?? { data: [], summary: {} };
}

export async function triggerControlRemediation(controlId, payload) {
  const response = await apiClient.post(`/api/governance/controls/${controlId}/remediation`, payload);
  return response?.data?.data;
}
