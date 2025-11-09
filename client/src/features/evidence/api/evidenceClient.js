import { apiClient } from "@/shared/lib/client";

const basePath = "/api/evidence";

const normalizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return acc;
      }
      acc[key] = trimmed;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});

export async function listEvidence(params = {}) {
  const response = await apiClient.get(basePath, { params: normalizeParams(params) });
  return response?.data ?? { data: [], pagination: { total: 0, limit: 25, offset: 0 }, summary: { retention: {} } };
}

export async function requestEvidenceUpload(payload) {
  const response = await apiClient.post(`${basePath}/upload`, payload);
  return response?.data;
}

export async function fetchEvidenceDetail(evidenceId) {
  const response = await apiClient.get(`${basePath}/${evidenceId}`);
  return response?.data?.data;
}

export async function updateEvidenceMetadata(evidenceId, payload) {
  const response = await apiClient.put(`${basePath}/${evidenceId}/metadata`, payload);
  return response?.data?.data;
}

export async function addEvidenceLinks(evidenceId, payload) {
  const response = await apiClient.post(`${basePath}/${evidenceId}/links`, payload);
  return response?.data?.data;
}

export async function removeEvidenceLink(evidenceId, linkId) {
  const response = await apiClient.delete(`${basePath}/${evidenceId}/links/${linkId}`);
  return response?.data?.data;
}

export async function requestEvidenceDownload(evidenceId) {
  const response = await apiClient.get(`${basePath}/${evidenceId}/download`);
  return response?.data?.data;
}

export async function fetchRetentionSummary() {
  const response = await apiClient.get(`${basePath}/retention`);
  return response?.data?.data ?? { stats: {}, policies: [], upcoming: [] };
}
