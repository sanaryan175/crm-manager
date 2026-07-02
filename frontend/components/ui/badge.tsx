'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-green-500/10 text-green-600 border border-green-500/20',
  warning: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
  error: 'bg-destructive/10 text-destructive border border-destructive/20',
  info: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
};

const sizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
