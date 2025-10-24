import { request } from '../../../shared/apiClient';

export const fetchHealthStatus = () => request('/health');
