import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updatedAccount = await request.json();
  const accountId = params.accountId;

  // Optional: validate type
  if (
    updatedAccount.type &&
    !['customer', 'supplier'].includes(updatedAccount.type)
  ) {
    return NextResponse.json({ error: 'Invalid account type.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('accounts')
    .update({
      name: updatedAccount.name,
      email: updatedAccount.email,
      phone: updatedAccount.phone,
      status: updatedAccount.status,
      type: updatedAccount.type,
    })
    .eq('id', accountId)
    .eq('user_uid', user.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Account not found or not authorized' },
      { status: 404 }
    );
  }

  return NextResponse.json(data[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accountId = params.accountId;

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_uid', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Account deleted successfully' });
}
