import { useState } from 'react';
import { request } from '../../../shared/apiClient';

export const useEmailTest = () => {
  const [status, setStatus] = useState({ state: 'idle' });

  const sendTestEmail = async (to) => {
    setStatus({ state: 'loading' });
    try {
      const response = await request('/email/test', {
        method: 'POST',
        body: { to },
      });
      setStatus({ state: 'success', data: response.data });
    } catch (error) {
      setStatus({ state: 'error', error });
    }
  };

  return {
    ...status,
    sendTestEmail,
  };
};
