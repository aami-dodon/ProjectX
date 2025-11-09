import { apiClient } from "@/lib/client";

export async function fetchChecks(params = {}) {
  const response = await apiClient.get("/api/governance/checks", { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 }, summary: {} };
}

export async function createCheckDefinition(payload) {
  const response = await apiClient.post("/api/governance/checks", payload);
  return response?.data?.data;
}

export async function updateCheckDefinition(checkId, payload) {
  const response = await apiClient.put(`/api/governance/checks/${checkId}`, payload);
  return response?.data?.data;
}

export async function activateCheckDefinition(checkId) {
  const response = await apiClient.post(`/api/governance/checks/${checkId}/activate`);
  return response?.data?.data;
}

export async function runCheckExecution(checkId, payload) {
  const response = await apiClient.post(`/api/governance/checks/${checkId}/run`, payload);
  return response?.data;
}

export async function fetchCheckResults(checkId, params = {}) {
  const response = await apiClient.get(`/api/governance/checks/${checkId}/results`, { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 } };
}

export async function publishCheckResult(resultId, payload = {}) {
  const response = await apiClient.post(`/api/governance/results/${resultId}/publish`, payload);
  return response?.data?.data;
}

export async function fetchReviewQueue(params = {}) {
  const response = await apiClient.get("/api/governance/review-queue", { params });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 0, offset: 0 } };
}

export async function completeReviewQueueItem(itemId, payload) {
  const response = await apiClient.post(`/api/governance/review-queue/${itemId}/complete`, payload);
  return response?.data;
}
