import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for now - this would typically come from a database
    const creators = [
      {
        id: '1',
        name: 'Sarah Mitchell',
        handle: '@sarahtrader',
        avatar: '👩‍💼',
        verified: true,
        subscribers: 45600,
        specialty: 'Options Trading',
        tier: 'elite',
        description: 'Professional options trader with 15+ years experience',
        monthlyRevenue: 125000
      },
      {
        id: '2',
        name: 'Marcus Chen',
        handle: '@marcusanalyst',
        avatar: '👨‍💼',
        verified: true,
        subscribers: 32100,
        specialty: 'Technical Analysis',
        tier: 'premium',
        description: 'Technical analysis expert and market strategist',
        monthlyRevenue: 89000
      },
      {
        id: '3',
        name: 'Emma Rodriguez',
        handle: '@emmainvests',
        avatar: '👩‍🎓',
        verified: true,
        subscribers: 28900,
        specialty: 'Value Investing',
        tier: 'premium',
        description: 'Value investing focused on long-term growth',
        monthlyRevenue: 76000
      },
      {
        id: '4',
        name: 'David Park',
        handle: '@davidcrypto',
        avatar: '👨‍💻',
        verified: true,
        subscribers: 51200,
        specialty: 'Crypto & DeFi',
        tier: 'elite',
        description: 'Cryptocurrency and DeFi market analysis',
        monthlyRevenue: 142000
      }
    ];

    return NextResponse.json(creators);
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

