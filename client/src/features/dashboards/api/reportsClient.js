import { apiClient } from "@/shared/lib/client";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const fetchFrameworkDashboard = async (params = {}) =>
  apiClient.get("/api/reports/dashboards/framework-scores", { params }).then(unwrap);

export const fetchControlHealthDashboard = async (params = {}) =>
  apiClient.get("/api/reports/dashboards/control-health", { params }).then(unwrap);

export const fetchRemediationDashboard = async (params = {}) =>
  apiClient.get("/api/reports/dashboards/remediation", { params }).then(unwrap);

export const fetchEvidenceDashboard = async () =>
  apiClient.get("/api/reports/dashboards/evidence").then(unwrap);

export const createReportExport = async (payload) =>
  apiClient.post("/api/reports/exports", payload).then(unwrap);

export const getReportExport = async (exportId) =>
  apiClient.get(`/api/reports/exports/${exportId}`).then(unwrap);

export const retryReportExport = async (exportId) =>
  apiClient.post(`/api/reports/exports/${exportId}/retry`).then(unwrap);
