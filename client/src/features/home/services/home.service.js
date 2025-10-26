// Feature: home
// Service layer for API calls related to the Home feature.
// Uses the shared Axios client. Keep functions pure and focused on IO.

import api from '@/lib/client';

// Example placeholder — replace or remove once real endpoints exist
export async function fetchHomeOverview() {
  // NOTE: This is a stub demonstrating the pattern.
  // When backend routes exist, update the URL and response shape accordingly.
  const { data } = await api.get('/home/overview');
  return data;
}

export default {
  fetchHomeOverview,
};
