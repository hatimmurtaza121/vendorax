import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updatedProduct = await request.json();
  const productId = params.productId;

  // Only update the products table
  const { data, error } = await supabase
    .from('products')
    .update({ ...updatedProduct })
    .eq('id', productId)
    .eq('user_uid', user.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const productId = params.productId;

  // Step 1: Check if this product is linked to any order_items
  const { data: linkedOrders, error: orderCheckError } = await supabase
    .from('order_items')
    .select('id')
    .eq('product_id', productId);

  if (orderCheckError) {
    return NextResponse.json({ error: orderCheckError.message }, { status: 500 });
  }

  if (linkedOrders && linkedOrders.length > 0) {
    // Product is linked to orders — block deletion
    return NextResponse.json({
      error: 'Cannot delete: Product is associated with existing orders.'
    }, { status: 400 });
  }

  // Step 2: If no orders found, proceed to delete the product
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('user_uid', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Product deleted successfully' });
}