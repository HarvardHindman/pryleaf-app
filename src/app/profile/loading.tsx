// Profile loading UI - Server Component (pre-rendered, shows instantly)
export default function ProfileLoading() {
  return (
    <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Profile header skeleton */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-24 h-24 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="h-4 w-64 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-6 w-32 rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

