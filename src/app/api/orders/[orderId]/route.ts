import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  const orderId = params.orderId;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Fetch existing order
  const { data: existingOrder, error: existingOrderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (existingOrderError || !existingOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 2. Fetch order items
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (orderItemsError || !orderItems) {
    return NextResponse.json({ error: 'Order items not found' }, { status: 404 });
  }

  // 3. Inventory adjustment
  if (existingOrder.status !== 'cancelled' && body.status === 'cancelled') {
    // ➡️ Revert stock (add back)
    for (const item of orderItems) {
      const { data: productData } = await supabase
        .from('products')
        .select('in_stock')
        .eq('id', item.product_id)
        .single();

      if (productData) {
        const newStock = productData.in_stock + item.quantity;
        await supabase
          .from('products')
          .update({ in_stock: newStock })
          .eq('id', item.product_id);
      }
    }

    // ➡️ Delete transaction linked to this order
    const { error: deleteTransactionError } = await supabase
      .from('transactions')
      .delete()
      .eq('order_id', orderId);

    if (deleteTransactionError) {
      return NextResponse.json({ error: deleteTransactionError.message }, { status: 500 });
    }
  } 
  else if (existingOrder.status === 'cancelled' && (body.status === 'pending' || body.status === 'completed')) {
    // ➡️ Reduce stock again if reviving the order
    for (const item of orderItems) {
      const { data: productData } = await supabase
        .from('products')
        .select('in_stock')
        .eq('id', item.product_id)
        .single();

      if (productData) {
        const newStock = productData.in_stock - item.quantity;
        await supabase
          .from('products')
          .update({ in_stock: newStock })
          .eq('id', item.product_id);
      }
    }
  }

  // 4. Update the order status
  const { data, error } = await supabase
    .from('orders')
    .update({ status: body.status })
    .eq('id', orderId)
    .select('*, account:account_id(name)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}


export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = params.orderId;

  // First, delete related order_items
  const { error: orderItemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  if (orderItemsError) {
    return NextResponse.json({ error: orderItemsError.message }, { status: 500 })
  }

  // Then, delete the order
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('user_uid', user.id)

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Order and related items deleted successfully' })
}
