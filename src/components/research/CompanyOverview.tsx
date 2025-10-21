'use client';

import { useState } from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TickerData } from '@/contexts/TickerCacheContext';
import { formatNumber } from '@/lib/formatters';

interface CompanyOverviewProps {
  data: TickerData;
}

export function CompanyOverview({ data }: CompanyOverviewProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }} className="text-sm">
            {showFullDescription ? data.description : data.description?.substring(0, 200) + '...'}
          </p>
          {data.description && data.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-sm font-medium mt-2"
              style={{ color: 'var(--interactive-primary)' }}
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Name</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.name}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CEO</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.ceo || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Website</p>
            {data.website ? (
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--interactive-primary)' }}>
                {data.website.replace('https://', '').replace('http://', '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>N/A</p>
            )}
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sector</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.sector || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Year Founded</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.founded || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Employees</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{data.employees ? formatNumber(data.employees) : 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

