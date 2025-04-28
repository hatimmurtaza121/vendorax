import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const supabase = createClient();

  const accountId = params.accountId;

  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('account_id', accountId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasOrders = data && data.length > 0;

  return NextResponse.json({ hasOrders });
}
