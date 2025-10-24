import { useCallback, useEffect, useState } from 'react';
import api from '../../../lib/api-client';

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
      const { data } = await api.get('/api/health');
      setState({ loading: false, data, error: null });
    } catch (error) {
      setState({ loading: false, data: null, error: error.message });
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { ...state, refresh: fetchHealth };
};

export default useHealthData;
