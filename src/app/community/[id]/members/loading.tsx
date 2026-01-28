// Community Members loading UI - Server Component (pre-rendered, shows instantly)
export default function CommunityMembersLoading() {
  return (
    <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="h-8 w-32 rounded animate-pulse mb-6" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-primary)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

