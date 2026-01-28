// Symbol loading UI - Server Component (pre-rendered, shows instantly)
export default function SymbolLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header skeleton */}
      <div 
        className="flex-shrink-0 border-b"
        style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-default)' }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div>
                  <div className="h-6 w-40 rounded animate-pulse mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                  <div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-6 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
          {/* Tab skeleton */}
          <div className="flex gap-4 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 p-6">
        <div className="max-w-[1800px] mx-auto flex gap-6">
          {/* Left column */}
          <div className="flex-1 space-y-4">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-6 w-32 rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)', width: `${100 - (i * 10)}%` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Right column - chart placeholder */}
          <div className="flex-1">
            <div className="rounded-lg p-6 h-96" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-full flex items-center justify-center">
                <div 
                  className="h-8 w-8 rounded-full animate-spin"
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-subtle)',
                    borderTopColor: 'var(--interactive-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

