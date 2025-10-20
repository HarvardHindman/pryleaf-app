'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Database } from 'lucide-react';

interface ApiUsageStats {
  used: number;
  remaining: number;
  limit: number;
  resetDate: string;
}

export default function ApiUsageStats() {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/alpha-vantage/usage');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            API Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            API Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load usage stats</p>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (stats.used / stats.limit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = stats.remaining === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          API Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Usage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Daily Requests</span>
            <span className={`font-medium ${
              isAtLimit ? 'text-red-600' : 
              isNearLimit ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {stats.used} / {stats.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit ? 'bg-red-500' : 
                isNearLimit ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-blue-500" />
            <span className="text-gray-600">Remaining:</span>
            <Badge variant={isAtLimit ? "destructive" : "secondary"} className="text-xs">
              {stats.remaining}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-green-500" />
            <span className="text-gray-600">Cached:</span>
            <Badge variant="outline" className="text-xs">
              Active
            </Badge>
          </div>
        </div>

        {/* Reset Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Resets daily at midnight UTC</span>
        </div>

        {/* Warning Messages */}
        {isAtLimit && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            ⚠️ Daily API limit reached. New requests will be served from cache only.
          </div>
        )}
        {isNearLimit && !isAtLimit && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            ⚠️ Approaching daily API limit. Consider using cached data.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
