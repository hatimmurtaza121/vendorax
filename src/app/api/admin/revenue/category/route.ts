import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: revenueData, error: revenueError } = await supabase
    .from('transactions')
    .select('amount, category, status, user_uid')
    .eq('status', 'paid')
    .eq('type', 'income')
    .eq('user_uid', userData.user.id);

  if (revenueError) {
    console.error('Error fetching revenue by category:', revenueError);
    return NextResponse.json({ error: 'Failed to fetch revenue by category' }, { status: 500 });
  }

  const revenueByCategory = revenueData?.reduce((acc, item) => {
    const category = item.category;
    if (!category) {
      return acc;
    }
    const revenue = item.amount;
    if (acc[category]) {
      acc[category] += revenue;
    } else {
      acc[category] = revenue;
    }
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({ revenueByCategory });
}
