export default function CommunityLoading() {
  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      {/* Hero Section Skeleton */}
      <div 
        className="border-b px-8 py-8"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div 
              className="h-8 w-64 rounded mb-2 animate-pulse"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            />
            <div 
              className="h-4 w-96 rounded animate-pulse"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div 
              className="flex-1 h-10 rounded-lg animate-pulse"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            />
            <div className="flex items-center space-x-2">
              <div 
                className="w-10 h-10 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--surface-secondary)' }}
              />
              <div 
                className="w-10 h-10 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--surface-secondary)' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Featured Creators Skeleton */}
        <section className="mb-10">
          <div 
            className="h-8 w-48 rounded mb-6 animate-pulse"
            style={{ backgroundColor: 'var(--surface-secondary)' }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="p-5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="w-20 h-20 rounded-full mb-3 animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                  <div 
                    className="h-4 w-32 rounded mb-2 animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                  <div 
                    className="h-3 w-24 rounded mb-2 animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                  <div 
                    className="h-6 w-20 rounded-full mb-3 animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                  <div 
                    className="h-3 w-full rounded mb-2 animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                  <div 
                    className="h-3 w-full rounded mb-3 animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                  <div 
                    className="h-10 w-full rounded-lg animate-pulse"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories Skeleton */}
        <section className="mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i}
                className="h-10 w-24 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--surface-secondary)' }}
              />
            ))}
          </div>
        </section>

        {/* Video Content Skeleton */}
        <section>
          <div 
            className="h-8 w-48 rounded mb-6 animate-pulse"
            style={{ backgroundColor: 'var(--surface-secondary)' }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface-primary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div 
                  className="w-full h-48 animate-pulse"
                  style={{ backgroundColor: 'var(--surface-secondary)' }}
                />
                <div className="p-4">
                  <div className="flex items-start mb-3">
                    <div 
                      className="w-10 h-10 rounded-full mr-3 animate-pulse flex-shrink-0"
                      style={{ backgroundColor: 'var(--surface-secondary)' }}
                    />
                    <div className="flex-1">
                      <div 
                        className="h-4 w-full rounded mb-2 animate-pulse"
                        style={{ backgroundColor: 'var(--surface-secondary)' }}
                      />
                      <div 
                        className="h-3 w-3/4 rounded mb-2 animate-pulse"
                        style={{ backgroundColor: 'var(--surface-secondary)' }}
                      />
                      <div 
                        className="h-3 w-1/2 rounded animate-pulse"
                        style={{ backgroundColor: 'var(--surface-secondary)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

