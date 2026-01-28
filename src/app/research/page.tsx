'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

export default function ResearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to NVDA symbol page immediately
    router.replace('/symbol/NVDA');
  }, [router]);

  // Show inline loading state within content area (layout stays visible)
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Page header skeleton */}
      <div 
        className="flex-shrink-0 border-b px-6 py-4"
        style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface-tertiary)' }}
          >
            <Building2 className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="space-y-2">
            <div 
              className="h-5 w-32 rounded animate-pulse"
              style={{ backgroundColor: 'var(--surface-tertiary)' }}
            />
            <div 
              className="h-3 w-24 rounded animate-pulse"
              style={{ backgroundColor: 'var(--surface-tertiary)' }}
            />
          </div>
        </div>
      </div>
      
      {/* Content area loading */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div 
            className="h-8 w-8 rounded-full animate-spin mb-3"
            style={{
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'var(--border-subtle)',
              borderTopColor: 'var(--interactive-primary)',
            }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading research...</p>
        </div>
      </div>
    </div>
  );
}
