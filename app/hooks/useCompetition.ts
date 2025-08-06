'use client';

import { useState, useEffect } from 'react';
import { competitionsAPI, Competition } from '../api/competitions';

interface UseCompetitionReturn {
  competition: Competition | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCompetition = (id: string): UseCompetitionReturn => {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetition = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await competitionsAPI.getCompetition(id);
      setCompetition(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch competition');
      setCompetition(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompetition();
    }
  }, [id]);

  const refetch = () => {
    fetchCompetition();
  };

  return {
    competition,
    isLoading,
    error,
    refetch,
  };
}; 