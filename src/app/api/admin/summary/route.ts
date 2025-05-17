import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  try {
    const [
      revenueTotalRes,
      revenueCatRes,
      expensesTotalRes,
      expensesCatRes,
      profitTotalRes,
      profitMarginRes,
      cashflowRes,
      salesThisMonthRes,
      ordersPendingRes,
      totalInventoryRes,
      outOfStockRes,
      lowStockRes,
      creditRes,
      debitRes
    ] = await Promise.all([
      supabase.rpc('get_total_revenue'),
      supabase.rpc('get_revenue_by_category'),
      supabase.rpc('get_total_expenses'),
      supabase.rpc('get_expenses_by_category'),
      supabase.rpc('get_total_profit'),
      supabase.rpc('get_profit_margin'),
      supabase.rpc('get_cash_flow'),
      supabase.rpc('get_sales_this_month'),
      supabase.rpc('get_orders_pending'),
      supabase.rpc('get_total_inventory'),
      supabase.rpc('get_out_of_stock_items'),
      supabase.rpc('get_low_stock_items'),
      supabase.rpc('get_credit_to_collect'),
      supabase.rpc('get_debit_to_pay')
    ]);

    const hasError = [
      revenueTotalRes,
      revenueCatRes,
      expensesTotalRes,
      expensesCatRes,
      profitTotalRes,
      profitMarginRes,
      cashflowRes,
      salesThisMonthRes,
      ordersPendingRes,
      totalInventoryRes,
      outOfStockRes,
      lowStockRes,
      creditRes,
      debitRes
    ].some(res => res.error);

    if (hasError) {
      const errorDetails = [
        revenueTotalRes.error,
        revenueCatRes.error,
        expensesTotalRes.error,
        expensesCatRes.error,
        profitTotalRes.error,
        profitMarginRes.error,
        cashflowRes.error,
        salesThisMonthRes.error,
        ordersPendingRes.error,
        totalInventoryRes.error,
        outOfStockRes.error,
        lowStockRes.error,
        creditRes.error,
        debitRes.error
      ].filter(Boolean);

      return NextResponse.json({ error: 'Failed to fetch summary', details: errorDetails }, { status: 500 });
    }

    return NextResponse.json({
      totalRevenue: revenueTotalRes.data,
      revenueByCategory: revenueCatRes.data,
      totalExpenses: expensesTotalRes.data,
      expensesByCategory: expensesCatRes.data,
      totalProfit: profitTotalRes.data,
      profitMargin: profitMarginRes.data,
      cashFlow: cashflowRes.data,
      salesThisMonth: salesThisMonthRes.data,
      ordersPending: ordersPendingRes.data,
      totalInventory: totalInventoryRes.data,
      outOfStockItems: outOfStockRes.data,
      lowStockItems: lowStockRes.data,
      creditToCollect: creditRes.data,
      debitToPay: debitRes.data
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error occurred', details: error }, { status: 500 });
  }
}
