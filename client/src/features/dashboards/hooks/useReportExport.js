import { useState } from "react";

import { createReportExport } from "@/features/dashboards/api/reportsClient";

export function useReportExport() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const schedule = async ({ exportType, format, filters, schedule }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await createReportExport({ exportType, format, filters, schedule });
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    schedule,
    isSubmitting,
    error,
  };
}
