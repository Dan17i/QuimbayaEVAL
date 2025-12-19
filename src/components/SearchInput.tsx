import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { debounce } from '../utils/debounce';
import { cn } from './ui/utils';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  defaultValue?: string;
}

/**
 * Componente de búsqueda con debounce
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  debounceMs = 300,
  className,
  defaultValue = '',
}) => {
  const [query, setQuery] = useState(defaultValue);

  // Crear función con debounce
  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

