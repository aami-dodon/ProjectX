import apiClient from '../../../lib/api-client';
import { formatHealthData } from '../utils/formatHealthData';

export const fetchHealthStatus = async () => {
  const { data } = await apiClient.get('/api/health');
  return formatHealthData(data);
};

export default {
  fetchHealthStatus,
};
