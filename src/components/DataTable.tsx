import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './ui/utils';
import { EmptyState } from './EmptyState';
import { TableRowSkeleton } from './SkeletonLoader';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  onRowClick?: (item: T) => void;
  className?: string;
}

/**
 * Componente de tabla reutilizable con ordenamiento
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  emptyIcon,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (columnKey: keyof T | string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortColumn !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns.length} />
          ))}
        </TableBody>
      </Table>
    );
  }

  if (sortedData.length === 0) {
    const EmptyIcon = emptyIcon || FileText;
    return (
      <div className="py-12">
        <EmptyState
          icon={EmptyIcon}
          title={emptyMessage}
          description="Intenta ajustar los filtros o la búsqueda"
        />
      </div>
    );
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              className={cn(
                column.sortable && 'cursor-pointer hover:bg-gray-50 select-none',
                column.className
              )}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <div className="flex items-center gap-2 group">
                <span>{column.header}</span>
                {column.sortable && getSortIcon(column.key)}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item) => (
          <TableRow
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(onRowClick && 'cursor-pointer hover:bg-gray-50')}
          >
            {columns.map((column, colIndex) => (
              <TableCell key={colIndex} className={column.className}>
                {column.render
                  ? column.render(item)
                  : (item[column.key] as React.ReactNode)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

