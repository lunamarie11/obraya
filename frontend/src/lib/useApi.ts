"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch data from the API with fallback to mock data.
 * When the backend is not running, it returns the fallback data
 * so the app always works (demo mode).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      console.warn("[ObraYa API] Backend no disponible, usando datos de demo:", err.message);
      setError(err.message);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for mutations (POST, PATCH, DELETE).
 * Returns a trigger function + loading/error state.
 */
export function useMutation<TInput, TResult>(
  mutator: (input: TInput) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async (input: TInput): Promise<TResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutator(input);
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error("[ObraYa API] Mutation failed:", err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutator]);

  return { trigger, loading, error };
}
