'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to NVDA symbol page immediately
    router.replace('/symbol/NVDA');
  }, [router]);

  // Show minimal loading state
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-muted">Loading research...</p>
      </div>
    </div>
  );
}
