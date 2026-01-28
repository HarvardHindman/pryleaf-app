// Community Dashboard loading UI - Server Component (pre-rendered, shows instantly)
export default function CommunityDashboardLoading() {
  return (
    <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg p-4" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
            <div className="h-4 w-20 rounded animate-pulse mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="h-8 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          </div>
        ))}
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-28 rounded animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)', width: `${100 - (i * 15)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

