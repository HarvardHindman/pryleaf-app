// Tier Management loading UI - Server Component (pre-rendered, shows instantly)
export default function TierManagementLoading() {
  return (
    <div className="p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
            <div className="h-6 w-24 rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="h-10 w-20 rounded animate-pulse mb-4" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

