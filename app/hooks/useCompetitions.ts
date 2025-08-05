import { useState, useEffect, useCallback } from 'react';
import { competitionsAPI, Competition, CompetitionFilters, CompetitionsResponse } from '../api/competitions';

interface UseCompetitionsReturn {
  competitions: Competition[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  filters: CompetitionFilters;
  setFilters: (filters: CompetitionFilters) => void;
}

export const useCompetitions = (initialFilters: CompetitionFilters = {}): UseCompetitionsReturn => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CompetitionFilters>({
    limit: 100, // Get more competitions by default
    is_active: true, // Only show active competitions
    ...initialFilters
  });

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: CompetitionsResponse = await competitionsAPI.getCompetitions(filters);
      
      setCompetitions(response.data);
      setTotalCount(response.count);
    } catch (err) {
      console.error('Failed to fetch competitions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch competitions');
      setCompetitions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
    filters,
    setFilters,
  };
}; 