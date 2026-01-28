'use client';

import { useEffect, useState } from 'react';

interface PageLoaderProps {
  /** Optional loading message */
  message?: string;
  /** Size variant - 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show full screen or inline */
  fullScreen?: boolean;
  /** Optional delay before showing loader (ms) - prevents flash for quick loads */
  delay?: number;
  /** Custom className for container */
  className?: string;
}

const sizeConfig = {
  sm: { spinner: 'h-6 w-6', text: 'text-xs' },
  md: { spinner: 'h-8 w-8', text: 'text-sm' },
  lg: { spinner: 'h-12 w-12', text: 'text-base' },
};

/**
 * Unified page loading component with consistent theme-aware styling.
 * Use this across all pages to ensure consistent loading experience.
 */
export default function PageLoader({
  message,
  size = 'md',
  fullScreen = true,
  delay = 0,
  className = '',
}: PageLoaderProps) {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!show) {
    return null;
  }

  const config = sizeConfig[size];

  const content = (
    <div className="flex flex-col items-center">
      {/* Spinner - uses theme-aware CSS variables */}
      <div
        className={`${config.spinner} rounded-full animate-spin mb-3`}
        style={{
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'var(--border-subtle)',
          borderTopColor: 'var(--interactive-primary)',
        }}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p
          className={config.text}
          style={{ color: 'var(--text-muted)' }}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`h-screen flex items-center justify-center ${className}`}
        style={{ backgroundColor: 'var(--surface-secondary)' }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center py-12 ${className}`}
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      {content}
    </div>
  );
}

/**
 * Inline loader for components that need a smaller loading indicator
 */
export function InlineLoader({
  message,
  size = 'sm',
  className = '',
}: Omit<PageLoaderProps, 'fullScreen' | 'delay'>) {
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div
        className={`${config.spinner} rounded-full animate-spin`}
        style={{
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'var(--border-subtle)',
          borderTopColor: 'var(--interactive-primary)',
        }}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <span className={config.text} style={{ color: 'var(--text-muted)' }}>
          {message}
        </span>
      )}
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({
  className = '',
  variant = 'text',
}: {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}) {
  const baseStyles = 'animate-pulse';
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{ backgroundColor: 'var(--surface-tertiary)' }}
    />
  );
}

/**
 * Card skeleton for loading card content
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg p-6 ${className}`}
      style={{
        backgroundColor: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="animate-pulse space-y-4">
        <SkeletonLoader className="h-4 w-1/3" />
        <SkeletonLoader className="h-8 w-2/3" />
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-4/5" />
      </div>
    </div>
  );
}

