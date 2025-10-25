import { useCallback, useEffect, useState } from 'react';
import { fetchHealthStatus } from '../services/healthApi';

const initialState = {
  loading: true,
  data: null,
  error: null,
};

const useHealthData = () => {
  const [state, setState] = useState(initialState);

  const fetchHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchHealthStatus();
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'Unable to load health diagnostics. Please try again later.';
      setState({ loading: false, data: null, error: message });
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { ...state, refresh: fetchHealth };
};

export default useHealthData;
