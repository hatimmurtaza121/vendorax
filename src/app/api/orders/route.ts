import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      accounts_id,
      total_amount,
      status,
      type,
      created_at,
      accounts ( name ),
      transactions ( status )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error.message);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }

  return NextResponse.json(data);
}


export async function POST(request: Request) {
  const supabase = createClient();
  const { accountId, products, total, paymentMethodId, paymentStatus } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Insert the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      accounts_id: accountId,
      total_amount: total,
      user_uid: user.id,
      status: "pending",
      type: "sale",
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // 2. Insert the order items
  const orderItems = products.map((product: any) => ({
    order_id: orderData.id,
    product_id: product.id,
    quantity: product.quantity,
    price: product.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    // Rollback created order
    await supabase.from('orders').delete().eq('id', orderData.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // 3. Decrease stock
  for (const item of products) {
    const { data: productData } = await supabase
      .from('products')
      .select('in_stock')
      .eq('id', item.id)
      .single();

    if (productData) {
      const newStock = productData.in_stock - item.quantity;
      await supabase
        .from('products')
        .update({ in_stock: newStock })
        .eq('id', item.id);
    }
  }

  // 4. Insert the transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      order_id: orderData.id,
      payment_method_id: paymentMethodId,
      amount: total,
      user_uid: user.id,
      type: "income",
      category: "selling",
      status: paymentStatus?.toLowerCase().trim() || "paid", // paid/unpaid from frontend
      description: `Payment for order #${orderData.id}`,
    });

  if (transactionError) {
    // Optional: rollback order + items (depends if you want strong consistency)
    await supabase.from('order_items').delete().eq('order_id', orderData.id);
    await supabase.from('orders').delete().eq('id', orderData.id);
    return NextResponse.json({ error: transactionError.message }, { status: 500 });
  }

  return NextResponse.json(orderData);
}
