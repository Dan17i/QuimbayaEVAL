import React from 'react';
import { cn } from './ui/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'destructive' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente Badge reutilizable para estados y etiquetas
 */
export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  children, 
  className 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    destructive: 'bg-red-100 text-red-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 bg-transparent text-gray-800',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

