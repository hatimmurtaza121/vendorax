import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // Optional filter by type (customer or supplier)
  let query = supabase
    .from('accounts')
    .select('id, name, email, phone, status, type')
    .eq('user_uid', user.id);

  if (type && ['customer', 'supplier'].includes(type)) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const newaccount = await request.json();

  if (!newaccount.type || !['customer', 'supplier'].includes(newaccount.type)) {
    return NextResponse.json({ error: 'Invalid or missing account type.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert([
      {
        ...newaccount,
        user_uid: user.id,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}
