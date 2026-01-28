// Portfolio loading UI - Server Component (pre-rendered, shows instantly)
export default function PortfolioLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 rounded w-40 mb-2 animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-4 rounded w-56 animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
        <div className="h-6 rounded w-32 animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
            <div className="animate-pulse">
              <div className="h-4 rounded w-1/3 mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-8 rounded w-2/3 mb-1" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
        <div className="animate-pulse">
          <div className="h-6 rounded w-48 mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-64 rounded w-full" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
      </div>

      {/* Holdings Table Skeleton */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
        <div className="animate-pulse">
          <div className="h-6 rounded w-40 mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded w-full" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
