import { apiClient } from "@/shared/lib/client";

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export async function fetchRoles(params = {}) {
  const { data } = await apiClient.get(`/api/auth/roles${buildQueryString(params)}`);
  return data?.roles ?? [];
}

export async function fetchRoleDetail(id) {
  if (!id) {
    throw new Error("Role id is required");
  }

  const { data } = await apiClient.get(`/api/auth/roles/${id}`);
  return data?.role ?? null;
}

export async function createRole(payload) {
  const { data } = await apiClient.post("/api/auth/roles", payload);
  return data?.role ?? null;
}

export async function updateRole(id, payload) {
  if (!id) {
    throw new Error("Role id is required");
  }

  const { data } = await apiClient.patch(`/api/auth/roles/${id}`, payload);
  return data?.role ?? null;
}

export async function archiveRole(id) {
  if (!id) {
    throw new Error("Role id is required");
  }

  const { data } = await apiClient.delete(`/api/auth/roles/${id}`);
  return data?.role ?? null;
}

export async function fetchPolicies(params = {}) {
  const { data } = await apiClient.get(`/api/auth/policies${buildQueryString(params)}`);
  return data?.policies ?? [];
}

export async function createPolicy(payload) {
  const { data } = await apiClient.post("/api/auth/policies", payload);
  return data?.policy ?? null;
}

export async function updatePolicy(id, payload) {
  if (!id) {
    throw new Error("Policy id is required");
  }

  const { data } = await apiClient.patch(`/api/auth/policies/${id}`, payload);
  return data?.policy ?? null;
}

export async function deletePolicy(id, options = {}) {
  if (!id) {
    throw new Error("Policy id is required");
  }

  const config = {};
  if (options.justification || options.summary) {
    config.data = {
      justification: options.justification ?? null,
      summary: options.summary ?? null,
    };
  }

  const { data } = await apiClient.delete(`/api/auth/policies/${id}${options.hardDelete ? "?hardDelete=true" : ""}`, config);
  return data?.policy ?? null;
}

export async function checkPermission({ resource, action, domain }) {
  const { data } = await apiClient.post("/api/auth/permissions/check", {
    resource,
    action,
    domain,
  });

  return data ?? { allowed: false };
}

export async function triggerAccessReview(payload) {
  const { data } = await apiClient.post("/api/auth/access-reviews", payload);
  return data;
}
