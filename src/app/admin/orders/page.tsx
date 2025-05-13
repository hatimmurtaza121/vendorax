"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import {
  Loader2Icon,
  PlusCircle,
  SearchIcon,
  EyeIcon,
  FilterIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LoadingButton } from "@/components/ui/loading-button";

interface Account {
  id: number;
  name: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: { name: string };
}

type Order = {
  id: number;
  accounts_id: number;
  total_amount: number;
  status: "completed" | "pending" | "cancelled";
  type: "sale" | "purchase";
  created_at: string;
  accounts: { name: string };
  transactions?: { status: "paid" | "unpaid" | "partial"; paid_amount: number }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrderCancelled, setIsOrderCancelled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nextPayment, setNextPayment] = useState<number | "">("");
  const [filters, setFilters] = useState({ status: "all" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nextPaymentError, setNextPaymentError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchAll() {
      try {
        const [ordersRes, accountsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/accounts"),
        ]);
        const ordersData = await ordersRes.json();
        const accountsData = await accountsRes.json();
        setOrders(ordersData);
        setAccounts(accountsData);
      } catch {
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status) {
        return false;
      }
      return true;
    });
  }, [orders, filters.status]);

  const handleCreateRedirect = () => router.push("/admin/sale");

  const handleFilterChange = (type: "status", value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };
  
  async function handleDeleteOrder() {
    if (!selectedOrder) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      setIsDialogOpen(false);
      setShowDeleteConfirm(false); // close the confirmation
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }


  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsOrderCancelled(order.status === "cancelled");
    setNextPayment("");
    try {
      const res = await fetch(`/api/orders/${order.id}/items`);
      const items = await res.json();
      setOrderItems(items);
      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    const paid = selectedOrder.transactions?.[0]?.paid_amount || 0;
    const total = selectedOrder.total_amount;
    const amountLeft = total - paid;

    const payment = typeof nextPayment === "number" ? nextPayment : 0;

    if (payment < 0) {
      setNextPaymentError("Payment cannot be less than 0.");
      return;
    }
    if (payment > amountLeft) {
      setNextPaymentError(`Payment cannot exceed $${amountLeft.toFixed(2)}.`);
      return;
    }

    setNextPaymentError(null);
    setIsSaving(true);
    try {
      // compute new paid amount
      const currentPaid = selectedOrder.transactions?.[0]?.paid_amount || 0;
      const add = typeof nextPayment === 'number' ? nextPayment : 0;
      const newPaid = currentPaid + add;
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid_amount: newPaid,
          status: selectedOrder.status
        }),
      });
      if (!res.ok) throw await res.json();
      // update local state
      setOrders(prev =>
        prev.map(o =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: selectedOrder.status,
                transactions: [{ ...o.transactions![0], paid_amount: newPaid }]
              }
            : o
        )
      );
      setSelectedOrder(o =>
        o
          ? {
              ...o,
              status: selectedOrder.status,
              transactions: [{ ...o.transactions![0], paid_amount: newPaid }]
            }
          : o
      );
      setNextPayment("");
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.error || 'Failed to update payment');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2Icon className="h-12 w-12 animate-spin"/></div>;
  }
  
  return (
    <>
      {error && <div className="text-red-600 p-4">{error}</div>}
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search orders..."
                  className="pr-8"
                />
                <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FilterIcon className="w-4 h-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {['all','pending','completed','cancelled'].map(st => (
                  <DropdownMenuCheckboxItem
                    key={st}
                    checked={filters.status === st}
                    onCheckedChange={() => handleFilterChange('status', st)}
                  >{st.charAt(0).toUpperCase()+st.slice(1)}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
              </DropdownMenu>

            </div>
            <Button size="sm" onClick={handleCreateRedirect}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Left</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(o => {
                  const paid = o.transactions?.[0]?.paid_amount || 0;
                  const left = o.total_amount - paid;
                  return (
                  <TableRow key={o.id}>
                    <TableCell>{o.id}</TableCell>
                    <TableCell>{o.accounts.name}</TableCell>
                    <TableCell>${o.total_amount.toFixed(2)}</TableCell>
                    <TableCell>${left.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{o.status}</TableCell>
                    <TableCell>{o.transactions?.[0]?.status}</TableCell>
                    <TableCell>{o.type}</TableCell>
                    <TableCell>{formatDate(o.created_at)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="hover:bg-blue-100 transition rounded-full" onClick={()=>handleViewOrder(o)}>
                        <EyeIcon className="w-5 h-5 text-gray-500 hover:text-blue-600 transition"/>
                      </Button>
                    </TableCell>
                  </TableRow>);
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order #{selectedOrder?.id} Details</DialogTitle></DialogHeader>
          <div className="space-y-4 text-m">
            <p><strong>Account:</strong> {selectedOrder?.accounts.name}</p>
            {/* Order Status */}
            <div className="flex items-center gap-2">
              <span className="block">Order Status</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="capitalize">
                    {selectedOrder?.status}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      setSelectedOrder(o =>
                        o ? { ...o, status: "pending" } : o
                      )
                    }
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      setSelectedOrder(o =>
                        o ? { ...o, status: "completed" } : o
                      )
                    }
                  >
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      setSelectedOrder(o =>
                        o ? { ...o, status: "cancelled" } : o
                      )
                    }
                  >
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p><strong>Payment Status:</strong> {selectedOrder?.transactions?.[0]?.status}</p>
            <p><strong>Amount Left:</strong> ${( (selectedOrder?.total_amount||0) - (selectedOrder?.transactions?.[0]?.paid_amount||0) ).toFixed(2)}</p>
            {['unpaid','partial'].includes(selectedOrder?.transactions?.[0]?.status||'') && (
              <div>
                <label htmlFor="next_payment" className="block mb-1">Next Payment</label>
                <Input
                  id="next_payment"
                  type="number"
                  min={0}
                  step={1}
                  value={nextPayment}
                  onChange={e => {
                    const v = e.target.value;
                    setNextPayment(v === '' ? '' : parseFloat(v));
                    setNextPaymentError(null); // clear as user types
                  }}
                  placeholder="Enter additional payment"
                />
                {nextPaymentError && (
                  <p className="text-sm text-red-600 mt-1">{nextPaymentError}</p>
                )}
              </div>
            )}
            <p><strong>Total:</strong> ${selectedOrder?.total_amount.toFixed(2)}</p>
            <p><strong>Created:</strong> {selectedOrder?.created_at ? formatDate(selectedOrder.created_at):'—'}</p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Items</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map(item=><TableRow key={item.id}><TableCell>{item.product.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>${item.price.toFixed(2)}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {!isOrderCancelled && (
              <LoadingButton
                onClick={handleUpdateOrder}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Save Changes
              </LoadingButton>
            )}
            <LoadingButton
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Order
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete order #{selectedOrder?.id}? This cannot be undone.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">
              Cancel
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={handleDeleteOrder}
              isLoading={isDeleting}
              loadingText="Deleting..."
            >
              Confirm Delete
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
