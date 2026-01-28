// Global loading UI - Uses CSS variables for theme consistency
// This is a Server Component that handles route transitions
// Shows content-area loading (layout is already visible from AppShell)
export default function Loading() {
  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--surface-secondary)' }}
    >
      {/* Content area skeleton */}
      <div className="p-6">
        <div className="space-y-4 mb-8">
          <div 
            className="h-8 w-48 rounded animate-pulse"
            style={{ backgroundColor: 'var(--surface-tertiary)' }}
          />
          <div 
            className="h-4 w-32 rounded animate-pulse"
            style={{ backgroundColor: 'var(--surface-tertiary)' }}
          />
        </div>
      </div>
      
      {/* Centered spinner in remaining space */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div 
            className="h-8 w-8 rounded-full animate-spin mb-3"
            style={{
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'var(--border-subtle)',
              borderTopColor: 'var(--interactive-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
