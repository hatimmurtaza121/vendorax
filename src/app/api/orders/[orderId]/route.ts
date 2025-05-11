import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient()
  const orderId   = Number(params.orderId)
  const payload   = await request.json()
  const { status, paid_amount } = payload

  // 1) Auth
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2) Load existing order status
  const { data: existingArr, error: ordErr } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
  if (ordErr || !existingArr?.length) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  const existingStatus = existingArr[0].status

  // 3) Load order items for stock adjustments
  const { data: itemsArr, error: itemsErr } = await supabase
    .from('order_items')
    .select('product_id,quantity')
    .eq('order_id', orderId)
  if (itemsErr) {
    return NextResponse.json({ error: 'Order items not found' }, { status: 404 })
  }

  // 4) Adjust stock on cancellation / uncancellation
  if (existingStatus !== 'cancelled' && status === 'cancelled') {
    // refund stock & delete transaction
    for (const it of itemsArr) {
      const { data: prodArr } = await supabase
        .from('products')
        .select('in_stock')
        .eq('id', it.product_id)
      const prod = prodArr?.[0]
      if (prod) {
        await supabase
          .from('products')
          .update({ in_stock: prod.in_stock + it.quantity })
          .eq('id', it.product_id)
      }
    }
    await supabase
      .from('transactions')
      .delete()
      .eq('order_id', orderId)
      .eq('user_uid', user.id)

  } else if (
    existingStatus === 'cancelled' &&
    (status === 'pending' || status === 'completed')
  ) {
    // re-apply stock
    for (const it of itemsArr) {
      const { data: prodArr } = await supabase
        .from('products')
        .select('in_stock')
        .eq('id', it.product_id)
      const prod = prodArr?.[0]
      if (prod) {
        await supabase
          .from('products')
          .update({ in_stock: prod.in_stock - it.quantity })
          .eq('id', it.product_id)
      }
    }
  }

  // 5) Update paid_amount on the transaction (DB trigger recalculates status)
  if (paid_amount != null) {
    const { error: txErr } = await supabase
      .from('transactions')
      .update({ paid_amount })
      .eq('order_id', orderId)
      .eq('user_uid', user.id)
    if (txErr) {
      console.error('Transaction update error', txErr)
      return NextResponse.json({ error: txErr.message }, { status: 500 })
    }
  }

  // 6) Build order update payload (only include status if provided)
  const orderUpdate: Record<string, unknown> = {}
  if (status !== undefined) {
    orderUpdate.status = status
  }

  // 7) Update order (or skip if no status change) and return joined data
  let ordArr: any[] | null = null
  let updErr: any = null

  if (orderUpdate.status) {
    ;({ data: ordArr, error: updErr } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', orderId)
      .select(`
        *,
        accounts ( name ),
        transactions ( paid_amount, status )
      `))
  } else {
    ;({ data: ordArr, error: updErr } = await supabase
      .from('orders')
      .select(`
        *,
        accounts ( name ),
        transactions ( paid_amount, status )
      `)
      .eq('id', orderId))
  }

  if (updErr || !ordArr?.length) {
    console.error('Order update error', updErr)
    return NextResponse.json(
      { error: updErr?.message || 'Order update failed' },
      { status: 500 }
    )
  }

  // 8) Return the updated order record
  return NextResponse.json(ordArr[0])
}


export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const orderId = params.orderId;

  // 1. delete all transactions for this order
  const { error: txnErr } = await supabase
    .from("transactions")
    .delete()
    .eq("order_id", orderId);
  if (txnErr) {
    return NextResponse.json(
      { error: txnErr.message },
      { status: 500 }
    );
  }

  // 2. delete all order_items for this order
  const { error: itemsErr } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);
  if (itemsErr) {
    return NextResponse.json(
      { error: itemsErr.message },
      { status: 500 }
    );
  }

  // 3. finally delete the order itself (only if it belongs to the current user)
  const { error: orderErr } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("user_uid", user.id);
  if (orderErr) {
    return NextResponse.json(
      { error: orderErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Order and all related records deleted." },
    { status: 200 }
  );
}