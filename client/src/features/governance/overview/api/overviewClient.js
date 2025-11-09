import { apiClient } from "@/shared/lib/client";

export async function fetchGovernanceOverview() {
  const response = await apiClient.get("/api/governance/overview");
  return response?.data?.data ?? null;
}

export async function triggerGovernanceRuns(payload = {}) {
  const response = await apiClient.post("/api/governance/runs", payload);
  return response?.data?.data ?? null;
}

export async function recalculateGovernanceScores(payload = {}) {
  const response = await apiClient.post("/api/governance/recalculate", payload);
  return response?.data?.data ?? null;
}
