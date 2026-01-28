// Public Profile loading UI - Server Component (pre-rendered, shows instantly)
export default function PublicProfileLoading() {
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

