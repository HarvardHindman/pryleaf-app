// Community Videos loading UI - Server Component (pre-rendered, shows instantly)
export default function CommunityVideosLoading() {
  return (
    <div style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header skeleton */}
      <div 
        className="border-b"
        style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
            <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          </div>
          {/* Filter skeleton */}
          <div className="flex gap-2 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Video grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="aspect-video animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                  <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

