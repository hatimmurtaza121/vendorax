import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createClient();
  const { transactionId } = params;
  const body = await request.json();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { description, category, type, amount, paid_amount } = body;

  const { data, error } = await supabase
    .from("transactions")
    .update({
      description,
      category,
      type,
      amount,
      paid_amount
    })
    .eq("id", Number(transactionId))
    .eq("user_uid", user.id)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}


export async function DELETE(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transactionId = params.transactionId;

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_uid', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Transaction deleted successfully' })
}
