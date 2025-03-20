// hooks/useResearchSubmissions.ts
import useSWR from 'swr';
import { fetchWithAuth } from '@/libs/auth';
import { BACKEND_URL } from '@/config';

const fetcher = (url: string) => fetchWithAuth(url).then(res => {
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
});

export const useResearchSubmissions = () => {
  const { data, error, mutate } = useSWR(`${BACKEND_URL}/research/submissions/`, fetcher);
  return {
    submissions: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
