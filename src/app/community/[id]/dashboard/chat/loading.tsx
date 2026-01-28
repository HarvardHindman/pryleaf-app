// Chat Settings loading UI - Server Component (pre-rendered, shows instantly)
export default function ChatSettingsLoading() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Chat header skeleton */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="h-6 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      </div>
      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
        ))}
      </div>
      {/* Input skeleton */}
      <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="h-10 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      </div>
    </div>
  );
}

