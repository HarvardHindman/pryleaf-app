// Content Management loading UI - Server Component (pre-rendered, shows instantly)
export default function ContentManagementLoading() {
  return (
    <div className="p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
            <div className="aspect-video animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

