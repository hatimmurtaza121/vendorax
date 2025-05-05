// File: src/app/api/manufacture/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { rawMaterials, finishedProducts } = await request.json();

  // Authenticate the user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: authError?.message || "Unauthorized" },
      { status: 401 }
    );
  }

  // Create a new production batch
  const { data: batch, error: batchError } = await supabase
    .from("production_batches")
    .insert([{ user_uid: user.id }])
    .select("id")
    .single();
  if (batchError || !batch) {
    return NextResponse.json(
      { error: batchError?.message || "Batch creation failed" },
      { status: 500 }
    );
  }
  const batchId = batch.id;

  // Consume raw materials: decrement stock and log movement
  for (const { productId, quantity } of rawMaterials) {
    // fetch current stock
    const { data: prod, error: fetchErr } = await supabase
      .from("products")
      .select("in_stock")
      .eq("id", productId)
      .single();
    if (fetchErr || !prod) {
      return NextResponse.json(
        { error: fetchErr?.message || "Product fetch failed" },
        { status: 500 }
      );
    }

    // update stock
    const newStock = prod.in_stock - quantity;
    await supabase
      .from("products")
      .update({ in_stock: newStock })
      .eq("id", productId);

    // log the change
    await supabase.from("stock_movements").insert({
      product_id: productId,
      type: "manufacture",       // or "adjustment"
      reference_id: batchId,     // links to production_batches.id
      description: `Consumed in batch #${batchId}`,
      user_uid: user.id,
    });
  }

  // Produce finished goods: increment stock and log movement
  for (const { productId, quantity } of finishedProducts) {
    // fetch current stock
    const { data: prod, error: fetchErr } = await supabase
      .from("products")
      .select("in_stock")
      .eq("id", productId)
      .single();
    if (fetchErr || !prod) {
      return NextResponse.json(
        { error: fetchErr?.message || "Product fetch failed" },
        { status: 500 }
      );
    }

    // update stock
    const newStock = prod.in_stock + quantity;
    await supabase
      .from("products")
      .update({ in_stock: newStock })
      .eq("id", productId);

    // log the change
    await supabase.from("stock_movements").insert({
      product_id: productId,
      type: "manufacture",       // or "adjustment"
      reference_id: batchId,     // links to production_batches.id
      description: `Produced in batch #${batchId}`,
      user_uid: user.id,
    });
  }

  return NextResponse.json({ batchId });
}
