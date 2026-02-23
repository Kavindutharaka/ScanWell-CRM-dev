import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing multi-select filter state.
 * @param {string[]} filterKeys - Array of filter key names, e.g. ['category', 'type', 'status']
 * @returns Filter state and helpers
 */
export default function useFilters(filterKeys) {
  // Initialize state: { category: [], type: [], status: [] }
  const [filters, setFilters] = useState(() => {
    const initial = {};
    filterKeys.forEach(key => { initial[key] = []; });
    return initial;
  });

  // Set a single filter's selected values
  const setFilter = useCallback((key, selected) => {
    setFilters(prev => ({ ...prev, [key]: selected }));
  }, []);

  // Clear all filters back to empty arrays
  const clearAllFilters = useCallback(() => {
    setFilters(prev => {
      const cleared = {};
      Object.keys(prev).forEach(key => { cleared[key] = []; });
      return cleared;
    });
  }, []);

  // Convert filter state to API query params object
  // Empty array = omitted (means "all"), non-empty = comma-separated
  const getApiParams = useCallback(() => {
    const params = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params[key] = values.join(',');
      }
    });
    return params;
  }, [filters]);

  // Count of active filters (filters with at least one selection)
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(arr => arr.length > 0).length;
  }, [filters]);

  // Boolean: are any filters active?
  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    setFilter,
    clearAllFilters,
    getApiParams,
    activeFilterCount,
    hasActiveFilters
  };
}
