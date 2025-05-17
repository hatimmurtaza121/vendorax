"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart";
import { Loader2Icon, TrendingUp } from "lucide-react";
import {
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";

export default function Page() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/admin/summary');
        const data = await res.json();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading || !summary) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Financial Summary Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Financial Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(summary.totalRevenue || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Expenses</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(summary.totalExpenses || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Profit</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(summary.totalProfit || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sales This Month</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(summary.salesThisMonth || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
          <Card>
            <CardHeader><CardTitle>Credit to Collect</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(summary.creditToCollect || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Debit to Pay</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(summary.debitToPay || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inventory Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Inventory Status</h2>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Total Inventory</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalInventory}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Low Stock (&lt;5)</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.lowStockItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Out of Stock Items</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.outOfStockItems}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Orders</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Pending Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.ordersPending}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Trends</h2>
        {/* Graphs second row */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue by Category</CardTitle>
              <PieChartIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <PiechartcustomChart data={summary.revenueByCategory} className="aspect-auto" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expenses by Category</CardTitle>
              <PieChartIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <PiechartcustomChart data={summary.expensesByCategory} className="aspect-auto" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin (selling)</CardTitle>
              <BarChartIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <BarchartChart data={summary.profitMargin} className="aspect-auto" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <LinechartChart data={summary.cashFlow} className="aspect-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

}


function BarChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function BarchartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  const chartConfig = {
    margin: {
      label: "Margin",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;
  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          <Bar dataKey="margin" fill="var(--color-margin)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function DollarSignIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function LinechartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <ChartContainer
        config={{
          amount: {
            label: "Amount",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Line
            dataKey="amount"
            type="monotone"
            stroke="var(--color-amount)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}


function PiechartcustomChart({ data = {}, ...props }: { data?: Record<string, number> } & React.HTMLAttributes<HTMLDivElement>) {
  const isValidData = data && typeof data === 'object' && !Array.isArray(data);

  const chartData = isValidData
    ? Object.entries(data).map(([category, value]) => ({
        category,
        value,
        fill: `var(--color-${category})`,
      }))
    : [];

  const chartConfig = isValidData
    ? Object.fromEntries(
        Object.keys(data).map((category, index) => [
          category,
          {
            label: category,
            color: `hsl(var(--chart-${index + 1}))`,
          },
        ])
      )
    : {};

  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={chartData} dataKey="value" nameKey="category" outerRadius={80} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}


