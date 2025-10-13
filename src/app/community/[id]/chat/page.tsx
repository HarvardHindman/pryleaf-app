'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function CommunityChatPage() {
  const params = useParams();
  const communityId = params.id as string;

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Chat in the Sidebar
        </h2>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
          Community chat channels are available in the left sidebar under "My Communities".
          <br />
          Look for your community channels below the main navigation.
        </p>
        <Link href={`/community/${communityId}`}>
          <button className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </button>
        </Link>
      </div>
    </div>
  );
}

