import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;

  try {
    // Insert products
    await supabase.from('products').insert([
      { name: 'Almonds', description: 'Premium quality raw almonds', price: 1200, in_stock: 50, unit: 'kg', user_uid: uid, category: 'dry fruit' },
      { name: 'Cashews', description: 'Whole cashew nuts', price: 1500, in_stock: 40, unit: 'kg', user_uid: uid, category: 'dry fruit' },
      { name: 'Raisins', description: 'Golden raisins', price: 800, in_stock: 60, unit: 'kg', user_uid: uid, category: 'dry fruit' },
      { name: 'Pistachios', description: 'Salted pistachios', price: 1600, in_stock: 30, unit: 'kg', user_uid: uid, category: 'dry fruit' },
    ]);

    // Insert accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .insert([
        { name: 'Karachi Super Mart', email: 'karachi@supermart.com', phone: '03001234567', user_uid: uid, status: 'active', type: 'customer' },
        { name: 'Baloch Dry Fruit Supplier', email: 'baloch@supplier.com', phone: '03331234567', user_uid: uid, status: 'active', type: 'supplier' },
        { name: 'Walk In Customer', email: null, phone: null, user_uid: uid, status: 'active', type: 'customer' },
        { name: 'Walk In Supplier', email: null, phone: null, user_uid: uid, status: 'active', type: 'supplier' },
      ])
      .select();

    const supplierId = accounts?.find(a => a.name === 'Baloch Dry Fruit Supplier')?.id;
    const customerId = accounts?.find(a => a.name === 'Karachi Super Mart')?.id;

    const { data: purchaseOrder } = await supabase
      .from('orders')
      .insert([{ accounts_id: supplierId, total_amount: 75000, user_uid: uid, status: 'completed', type: 'purchase' }])
      .select()
      .single();

    const { data: saleOrder } = await supabase
      .from('orders')
      .insert([{ accounts_id: customerId, total_amount: 92000, user_uid: uid, status: 'completed', type: 'sale' }])
      .select()
      .single();

    const { data: products } = await supabase.from('products').select('id,name').eq('user_uid', uid);
    const almondId = products?.find(p => p.name === 'Almonds')?.id;
    const pistachioId = products?.find(p => p.name === 'Pistachios')?.id;
    const raisinId = products?.find(p => p.name === 'Raisins')?.id;

    await supabase.from('order_items').insert([
      { order_id: purchaseOrder.id, product_id: almondId, quantity: 30, price: 1000 },
      { order_id: purchaseOrder.id, product_id: raisinId, quantity: 20, price: 750 },
      { order_id: saleOrder.id, product_id: almondId, quantity: 10, price: 1200 },
      { order_id: saleOrder.id, product_id: pistachioId, quantity: 10, price: 1600 },
    ]);

    await supabase.from('transactions').insert([
      {
        description: 'Payment for Purchase Order',
        order_id: purchaseOrder.id,
        amount: 75000,
        paid_amount: 75000,
        user_uid: uid,
        type: 'expense',
        category: 'purchasing',
        status: 'paid',
      },
      {
        description: 'Payment Received for Sale Order',
        order_id: saleOrder.id,
        amount: 92000,
        paid_amount: 50000,
        user_uid: uid,
        type: 'income',
        category: 'selling',
        status: 'partial',
      },
    ]);

    await supabase.from('stock_movements').insert([
      { product_id: almondId, type: 'purchase', reference_id: purchaseOrder.id, description: 'Purchased 30 kg almonds', user_uid: uid },
      { product_id: raisinId, type: 'purchase', reference_id: purchaseOrder.id, description: 'Purchased 20 kg raisins', user_uid: uid },
      { product_id: almondId, type: 'sale', reference_id: saleOrder.id, description: 'Sold 10 kg almonds', user_uid: uid },
      { product_id: pistachioId, type: 'sale', reference_id: saleOrder.id, description: 'Sold 10 kg pistachios', user_uid: uid },
    ]);

    return NextResponse.json({ message: 'Demo data created successfully!' });
  } catch (err) {
    console.error('Demo data error:', err);
    return NextResponse.json({ error: 'Failed to create demo data' }, { status: 500 });
  }
}
