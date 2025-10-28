import { useEffect, useState } from "react";

const isBrowser = () => typeof window !== "undefined";

const toFiniteOrNull = (value) => (Number.isFinite(value) ? value : null);

const collectNavigatorMetrics = async () => {
  if (!isBrowser()) {
    return null;
  }

  const { navigator, performance } = window;

  const cpu = {
    logicalProcessors:
      typeof navigator?.hardwareConcurrency === "number"
        ? navigator.hardwareConcurrency
        : null,
    deviceMemoryGb:
      typeof navigator?.deviceMemory === "number" ? navigator.deviceMemory : null,
  };

  const perfMemory = performance?.memory;
  const memory = perfMemory
    ? {
        usedBytes: toFiniteOrNull(perfMemory.usedJSHeapSize),
        totalBytes: toFiniteOrNull(perfMemory.totalJSHeapSize),
        limitBytes: toFiniteOrNull(perfMemory.jsHeapSizeLimit),
      }
    : null;

  let storage = null;
  if (navigator?.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageBytes = toFiniteOrNull(estimate?.usage);
      const quotaBytes = toFiniteOrNull(estimate?.quota);
      storage = {
        usageBytes,
        quotaBytes,
        utilizationPercent:
          usageBytes && quotaBytes ? (usageBytes / quotaBytes) * 100 : null,
        persisted: navigator.storage.persisted
          ? await navigator.storage.persisted()
          : null,
      };
    } catch (error) {
      storage = {
        usageBytes: null,
        quotaBytes: null,
        utilizationPercent: null,
        persisted: null,
        error: error?.message ?? "Unable to estimate storage usage.",
      };
    }
  }

  return {
    timestamp: Date.now(),
    cpu,
    memory,
    storage,
  };
};

export function useClientRuntimeMetrics({ refreshMs = 30000 } = {}) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      const snapshot = await collectNavigatorMetrics();
      if (!cancelled && snapshot) {
        setMetrics(snapshot);
      }
    };

    run();

    if (!refreshMs) {
      return () => {
        cancelled = true;
      };
    }

    const id = window.setInterval(run, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [refreshMs]);

  return metrics;
}
