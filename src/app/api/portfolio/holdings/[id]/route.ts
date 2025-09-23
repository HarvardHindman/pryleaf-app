import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PortfolioService } from '@/lib/portfolioService';

// Update a specific holding
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shares, averageCost } = await request.json();
    
    // Validate input
    if (shares === undefined || averageCost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (shares < 0 || averageCost < 0) {
      return NextResponse.json({ error: 'Shares and cost must be non-negative' }, { status: 400 });
    }
    
    // Await params for Next.js 15
    const { id } = await params;
    
    const holding = await PortfolioService.updateHoldingWithClient(
      supabase,
      id, 
      Number(shares), 
      Number(averageCost)
    );
    
    return NextResponse.json({ holding });
  } catch (error) {
    console.error('Update holding error:', error);
    return NextResponse.json({ error: 'Failed to update holding' }, { status: 500 });
  }
}

// Delete a specific holding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await params for Next.js 15
    const { id } = await params;
    
    await PortfolioService.removeHoldingWithClient(supabase, id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete holding error:', error);
    return NextResponse.json({ error: 'Failed to delete holding' }, { status: 500 });
  }
}
