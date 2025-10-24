import { useState } from 'react';
import { request } from '../../../shared/apiClient';

export const useStorageUpload = () => {
  const [status, setStatus] = useState({ state: 'idle' });

  const upload = async (file) => {
    setStatus({ state: 'loading' });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await request('/storage/upload', {
        method: 'POST',
        body: formData,
      });
      setStatus({ state: 'success', data: response.data });
    } catch (error) {
      setStatus({ state: 'error', error });
    }
  };

  return {
    ...status,
    upload,
  };
};
