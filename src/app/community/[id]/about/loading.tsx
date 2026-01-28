// Community About loading UI - Server Component (pre-rendered, shows instantly)
export default function CommunityAboutLoading() {
  return (
    <div className="h-full p-6" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-3xl">
        <div className="h-8 w-24 rounded animate-pulse mb-6" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        <div className="space-y-4">
          <div className="h-4 w-full rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-4 w-5/6 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-4 w-4/6 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-6 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

