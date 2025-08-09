import { useState, useEffect, useCallback } from 'react';
import { competitionsAPI, Competition, CompetitionListResponse } from '../api/competitions';

interface UseCompetitionsReturn {
  competitions: Competition[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

export const useCompetitions = (): UseCompetitionsReturn => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: CompetitionListResponse = await competitionsAPI.getCompetitions();
      
      // Handle the new response format
      if (response && response.competitions) {
        setCompetitions(response.competitions);
        setTotalCount(response.total || 0);
      } else {
        // Fallback for unexpected response format
        setCompetitions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch competitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch competitions');
      setCompetitions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchCompetitions();
  }, [fetchCompetitions]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  return {
    competitions,
    loading,
    error,
    totalCount,
    refetch,
  };
}; 