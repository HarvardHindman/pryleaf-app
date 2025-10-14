import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Mock data for now - this would typically come from a database
    const videos = [
      {
        id: '1',
        title: 'Advanced Options Strategies for Volatile Markets - Complete Guide',
        creatorId: '1',
        thumbnail: '📊',
        duration: '24:35',
        views: 12400,
        likes: 892,
        comments: 156,
        uploadedAt: '2 hours ago',
        tier: 'premium',
        category: 'Options Trading'
      },
      {
        id: '2',
        title: 'Technical Analysis: Identifying Breakout Patterns in Real-Time',
        creatorId: '2',
        thumbnail: '📈',
        duration: '18:22',
        views: 9800,
        likes: 745,
        comments: 92,
        uploadedAt: '5 hours ago',
        tier: 'free',
        category: 'Technical Analysis'
      },
      {
        id: '3',
        title: 'Value Investing Masterclass: Finding Hidden Gems in 2025',
        creatorId: '3',
        thumbnail: '💎',
        duration: '31:45',
        views: 15600,
        likes: 1203,
        comments: 234,
        uploadedAt: '1 day ago',
        tier: 'elite',
        category: 'Value Investing'
      },
      {
        id: '4',
        title: 'DeFi Portfolio Strategies: Maximizing Yield While Managing Risk',
        creatorId: '4',
        thumbnail: '🔗',
        duration: '22:18',
        views: 18200,
        likes: 1456,
        comments: 312,
        uploadedAt: '1 day ago',
        tier: 'premium',
        category: 'Crypto & DeFi'
      },
      {
        id: '5',
        title: 'Weekly Market Outlook: Key Levels to Watch This Week',
        creatorId: '2',
        thumbnail: '🎯',
        duration: '15:42',
        views: 21300,
        likes: 1678,
        comments: 189,
        uploadedAt: '2 days ago',
        tier: 'free',
        category: 'Market Analysis'
      },
      {
        id: '6',
        title: 'Building Your First Options Portfolio - Step by Step Tutorial',
        creatorId: '1',
        thumbnail: '📚',
        duration: '28:56',
        views: 8900,
        likes: 634,
        comments: 78,
        uploadedAt: '3 days ago',
        tier: 'free',
        category: 'Options Trading'
      }
    ];

    // Filter by category if provided
    let filteredVideos = videos;
    if (category && category !== 'all') {
      filteredVideos = videos.filter(
        video => video.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search query if provided
    if (search) {
      filteredVideos = filteredVideos.filter(
        video => video.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json(filteredVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}



