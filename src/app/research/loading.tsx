// Research loading UI - Server Component (pre-rendered, shows instantly)
export default function ResearchLoading() {
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

