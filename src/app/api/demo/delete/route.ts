import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;

  try {
    // Clean up stock movements
    await supabase.from('stock_movements').delete().eq('user_uid', uid);

    // Get and clean production data
    const { data: batches } = await supabase
      .from('production_batches')
      .select('id')
      .eq('user_uid', uid);

    const batchIds = batches?.map(b => b.id) ?? [];

    if (batchIds.length > 0) {
      await supabase.from('production_raw').delete().in('production_batch_id', batchIds);
      await supabase.from('production_finished').delete().in('production_batch_id', batchIds);
    }

    await supabase.from('production_batches').delete().eq('user_uid', uid);

    // Get and clean orders and related
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_uid', uid);

    const orderIds = orders?.map(o => o.id) ?? [];

    if (orderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', orderIds);
      await supabase.from('transactions').delete().in('order_id', orderIds);
    }

    await supabase.from('orders').delete().eq('user_uid', uid);
    await supabase.from('products').delete().eq('user_uid', uid);
    await supabase.from('accounts').delete().eq('user_uid', uid);

    return NextResponse.json({ message: 'All demo data deleted successfully!' });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete demo data' }, { status: 500 });
  }
}
