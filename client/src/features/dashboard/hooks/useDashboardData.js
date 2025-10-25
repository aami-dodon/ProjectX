import { useMemo } from 'react';
import rows from '../data/data.json';

// Returns dashboard rows shaped for DataTable
export function useDashboardData() {
  // Ensure numeric fields stay strings for display, but keep id numeric
  const data = useMemo(() => {
    return rows.map((r) => ({
      id: Number(r.id),
      header: String(r.header),
      type: String(r.type),
      status: String(r.status),
      target: String(r.target),
      limit: String(r.limit),
      reviewer: String(r.reviewer),
    }));
  }, []);

  return { rows: data };
}

export default useDashboardData;
