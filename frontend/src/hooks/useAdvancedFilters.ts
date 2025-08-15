import { useState, useMemo, useCallback } from 'react';
import { debounce } from '@/utils';

export interface FilterConfig {
  key: string;
  type: 'text' | 'select' | 'range' | 'date' | 'boolean';
  label: string;
  options?: { label: string; value: any }[];
  defaultValue?: any;
}

export interface FilterValue {
  key: string;
  value: any;
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
}

export const useAdvancedFilters = <T>(
  data: T[],
  filterConfigs: FilterConfig[]
) => {
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const debouncedSetSearchTerm = useCallback(
    debounce((term: string) => setSearchTerm(term), 300),
    []
  );

  const addFilter = useCallback((filter: FilterValue) => {
    setFilters(prev => {
      const existingIndex = prev.findIndex(f => f.key === filter.key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = filter;
        return updated;
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => prev.filter(f => f.key !== key));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setSearchTerm('');
  }, []);

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search term
    if (searchTerm) {
      result = result.filter(item => {
        return Object.values(item as any).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply filters
    filters.forEach(filter => {
      result = result.filter(item => {
        const itemValue = (item as any)[filter.key];
        const filterValue = filter.value;
        const operator = filter.operator || 'eq';

        switch (operator) {
          case 'eq':
            return itemValue === filterValue;
          case 'ne':
            return itemValue !== filterValue;
          case 'gt':
            return itemValue > filterValue;
          case 'lt':
            return itemValue < filterValue;
          case 'gte':
            return itemValue >= filterValue;
          case 'lte':
            return itemValue <= filterValue;
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'in':
            return Array.isArray(filterValue) ? filterValue.includes(itemValue) : false;
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters, searchTerm, sortConfig]);

  const activeFiltersCount = filters.length + (searchTerm ? 1 : 0);

  return {
    filteredData: filteredAndSortedData,
    filters,
    searchTerm,
    sortConfig,
    activeFiltersCount,
    addFilter,
    removeFilter,
    clearFilters,
    setSearchTerm: debouncedSetSearchTerm,
    handleSort,
    filterConfigs
  };
};
