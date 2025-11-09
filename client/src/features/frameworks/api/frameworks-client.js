import { apiClient } from "@/lib/client";

export async function fetchFrameworks(params = {}) {
  const response = await apiClient.get("/api/frameworks", { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 } };
}

export async function fetchFramework(frameworkId) {
  const response = await apiClient.get(`/api/frameworks/${frameworkId}`);
  return response?.data ?? { data: null };
}

export async function createFramework(payload) {
  const response = await apiClient.post("/api/frameworks", payload);
  return response?.data?.data;
}

export async function updateFramework(frameworkId, payload) {
  const response = await apiClient.patch(`/api/frameworks/${frameworkId}`, payload);
  return response?.data?.data;
}

export async function fetchFrameworkControls(frameworkId, params = {}) {
  const response = await apiClient.get(`/api/frameworks/${frameworkId}/controls`, { params });
  return response?.data ?? { data: [] };
}

export async function createFrameworkControl(frameworkId, payload) {
  const response = await apiClient.post(`/api/frameworks/${frameworkId}/controls`, payload);
  return response?.data?.data;
}

export async function fetchFrameworkMappings(frameworkId, params = {}) {
  const response = await apiClient.get(`/api/frameworks/${frameworkId}/mappings`, { params });
  return response?.data ?? { data: [], summary: {}, matrix: [] };
}

export async function createFrameworkMapping(frameworkId, payload) {
  const response = await apiClient.post(`/api/frameworks/${frameworkId}/mappings`, payload);
  return response?.data?.data;
}

export async function fetchFrameworkVersions(frameworkId) {
  const response = await apiClient.get(`/api/frameworks/${frameworkId}/versions`);
  return response?.data ?? { data: [] };
}

export async function createFrameworkVersion(frameworkId, payload) {
  const response = await apiClient.post(`/api/frameworks/${frameworkId}/versions`, payload);
  return response?.data?.data;
}
