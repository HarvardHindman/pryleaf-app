import { NextRequest, NextResponse } from 'next/server';
import { StockCacheService } from '@/cache';

export async function GET(request: NextRequest) {
  try {
    const usageStats = await StockCacheService.getUsageStats();

    if (!usageStats) {
      return NextResponse.json(
        { error: 'Failed to fetch usage stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(usageStats);

  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
