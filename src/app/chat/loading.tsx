// Chat loading UI - Server Component (pre-rendered, shows instantly)
export default function ChatLoading() {
  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Left Sidebar skeleton */}
      <div 
        className="w-60 border-r flex flex-col"
        style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Server Header skeleton */}
        <div className="h-20 px-4 flex flex-col justify-center border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="h-5 w-32 rounded animate-pulse mb-2" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
        {/* Channels skeleton */}
        <div className="flex-1 p-2 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2 rounded">
              <div className="h-4 w-4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-4 rounded animate-pulse flex-1" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header skeleton */}
        <div 
          className="h-20 px-6 flex items-center border-b"
          style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            <div className="h-5 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
          </div>
        </div>
        
        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3" style={{ opacity: 1 - (i * 0.15) }}>
              <div className="w-8 h-8 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
                <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)', width: `${60 + (i * 10)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Input skeleton */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="h-10 w-full rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
      </div>

      {/* Right Sidebar skeleton */}
      <div 
        className="w-48 border-l flex flex-col"
        style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="h-20 px-3 flex items-center border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="h-4 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
              <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-tertiary)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

