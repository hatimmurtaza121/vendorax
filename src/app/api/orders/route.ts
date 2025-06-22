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
      transactions (
        paid_amount,
        status
      )
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

  try {
    // ── Auth ───────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Payload ────────────────────────────────────────────
    const {
      accountId,
      products: items,
      total_amount,
      type,
      paid_amount = 0,
    } = await request.json();

    // ── 1) Create Order ────────────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        accounts_id: accountId,
        total_amount,
        type,
        status: "pending",
        user_uid: user.id,
      })
      .select()
      .single();
    if (orderErr || !order) {
      console.error("Order insert error", orderErr);
      return NextResponse.json(
        { error: orderErr?.message || "Order insert failed" },
        { status: 500 }
      );
    }

    // ── 2) Create Order Items ──────────────────────────────
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .insert(
        items.map((it: any) => ({
          order_id: order.id,
          product_id: it.productId,
          quantity: it.quantity,
          price: it.price, // this is buyPrice for purchases
        }))
      )
      .select();
    if (itemsErr || !orderItems) {
      console.error("Order items insert error", itemsErr);
      return NextResponse.json(
        { error: itemsErr?.message || "Order items insert failed" },
        { status: 500 }
      );
    }

    // ── 3) Adjust Stock, Log Movements & Update Sell Price ─
    for (const it of items) {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("in_stock, price")
        .eq("id", it.productId)
        .single();
      if (prodErr || !product) throw prodErr || new Error("Missing product");

      const newStock =
        type === "sale"
          ? product.in_stock - it.quantity
          : product.in_stock + it.quantity;

      await supabase
        .from("products")
        .update({ in_stock: newStock })
        .eq("id", it.productId);

      // For purchase: update products.price if sellPrice differs
      if (type === "purchase" && product.price !== it.sellPrice) {
        await supabase
          .from("products")
          .update({ price: it.sellPrice })
          .eq("id", it.productId);
      }

      await supabase.from("stock_movements").insert({
        product_id: it.productId,
        type, // 'sale' or 'purchase'
        reference_id: order.id,
        description: `${type} order ${order.id}`,
        user_uid: user.id,
      });
    }

    // ── 4) Create Transaction ──────────────────────────────
    const status =
      paid_amount >= total_amount
        ? "paid"
        : paid_amount <= 0
        ? "unpaid"
        : "partial";

    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        order_id: order.id,
        amount: total_amount,
        paid_amount,
        status,
        user_uid: user.id,
        type: type === "sale" ? "income" : "expense",
        category: type === "sale" ? "selling" : "purchase",
        description: `Transaction for order #${order.id}`,
      })
      .select();

    if (txErr || !tx) {
      console.error("Transaction insert error", txErr);
      return NextResponse.json(
        { error: txErr?.message || "Transaction insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ order, orderItems, transaction: tx });
  } catch (err: any) {
    console.error("Unexpected POST /api/orders error", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}