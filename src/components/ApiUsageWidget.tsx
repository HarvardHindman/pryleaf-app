'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Activity } from 'lucide-react';

interface ApiUsage {
  date: string;
  requests_used: number;
  requests_limit: number;
  requests_remaining: number;
  percentage_used: number;
  updated_at: string;
}

export default function ApiUsageWidget() {
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
    // Refresh every 30 seconds
    const interval = setInterval(loadUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadUsage() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_today_api_usage');
      
      if (!error && data) {
        const usageData = typeof data === 'string' ? JSON.parse(data) : data;
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Error loading API usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div 
        className="p-4 rounded-lg border animate-pulse"
        style={{ 
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!usage) return null;

  const getStatusColor = () => {
    if (usage.requests_remaining === 0) return 'var(--danger-text)';
    if (usage.requests_remaining <= 5) return 'var(--warning-text)';
    if (usage.requests_remaining <= 10) return 'var(--warning-text)';
    return 'var(--success-text)';
  };

  const getStatusIcon = () => {
    if (usage.requests_remaining === 0) return '🔴';
    if (usage.requests_remaining <= 5) return '🟡';
    if (usage.requests_remaining <= 10) return '🟠';
    return '🟢';
  };

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        backgroundColor: 'var(--surface-primary)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: 'var(--interactive-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            API Usage Today
          </h3>
        </div>
        <span className="text-lg">{getStatusIcon()}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Used
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {usage.requests_used} / {usage.requests_limit}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Remaining
          </span>
          <span className="text-sm font-bold" style={{ color: getStatusColor() }}>
            {usage.requests_remaining}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--surface-tertiary)' }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${usage.percentage_used}%`,
                backgroundColor: getStatusColor()
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {usage.percentage_used}% used
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(usage.updated_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

