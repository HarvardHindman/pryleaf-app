// Community loading UI - Server Component (pre-rendered, shows instantly)
export default function CommunityLoading() {
  return (
    <div className="h-full" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Banner skeleton */}
      <div className="h-48 w-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-start gap-6 -mt-16">
          <div 
            className="w-32 h-32 rounded-lg animate-pulse flex-shrink-0"
            style={{ backgroundColor: 'var(--surface-primary)', border: '4px solid var(--surface-secondary)' }}
          />
          <div className="pt-20 flex-1">
            <div className="h-8 w-48 rounded animate-pulse mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-4 mt-8 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          ))}
        </div>
        {/* Content grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="aspect-video animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

