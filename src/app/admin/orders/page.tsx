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
  transactions?: { status: "paid" | "unpaid" }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isOrderCancelled, setIsOrderCancelled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(selectedOrder?.transactions?.[0]?.status || "unpaid");
  const [filters, setFilters] = useState({
    status: "all",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, accountsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/accounts"),
        ]);
        const [ordersData, accountsData] = await Promise.all([
          ordersRes.json(),
          accountsRes.json(),
        ]);
        setOrders(ordersData);
        setAccounts(accountsData);
      } catch (err) {
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };
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

  const handleCreateRedirect = () => {
    router.push("/admin/sale");
  };

  const handleFilterChange = (type: "status", value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
  };
  
  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setPaymentStatus(order.transactions?.[0]?.status || "unpaid");
    setIsOrderCancelled(order.status === "cancelled");
    try {
      const res = await fetch(`/api/orders/${order.id}/items`);
      const items = await res.json();
      setOrderItems(items);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Failed to fetch order items", err);
    }
  };
  
  const handleUpdateOrder = async () => {
    if (!selectedOrder || isOrderCancelled) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedOrder.status,
          paymentStatus: paymentStatus,
        }),
      });
  
      if (!res.ok) {
        throw new Error("Failed to update order");
      }
  
      const updatedOrder = await res.json();

      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      setSelectedOrder(updatedOrder);

      setShowSuccessToast(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setIsSaving(false);
    }
  };
  

  return (
    <>
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded shadow-lg">
          Order updated successfully!
        </div>
      )}

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
                  <DropdownMenuCheckboxItem
                    checked={filters.status === "all"}
                    onCheckedChange={() => handleFilterChange("status", "all")}
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.status === "pending"}
                    onCheckedChange={() => handleFilterChange("status", "pending")}
                  >
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.status === "completed"}
                    onCheckedChange={() => handleFilterChange("status", "completed")}
                  >
                    Completed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.status === "cancelled"}
                    onCheckedChange={() => handleFilterChange("status", "cancelled")}
                  >
                    Cancelled
                  </DropdownMenuCheckboxItem>
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
                  <TableHead>Total</TableHead>
                  <TableHead>Delivery Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(orders) && orders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.accounts?.name ?? "Unknown"}</TableCell>
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{order.transactions?.[0]?.status || '-'}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="icon" 
                          variant="ghost"
                          className="hover:bg-blue-100 transition rounded-full" 
                          onClick={() => handleViewOrder(order)}
                        >
                        <EyeIcon className="w-5 h-5 text-gray-500 hover:text-blue-600 transition" />
                        <span className="sr-only">View</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No orders found
                  </TableCell>
                </TableRow>
              )}

              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id} Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Account:</strong> {selectedOrder?.accounts?.name}</p>

            <div className="flex items-center gap-2">
              <strong>Delivery Status:</strong>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="capitalize">
                    {selectedOrder?.status || "Select status"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() =>
                      setSelectedOrder((prev) =>
                        prev ? { ...prev, status: "pending" } : null
                      )
                    }
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSelectedOrder((prev) =>
                        prev ? { ...prev, status: "completed" } : null
                      )
                    }
                  >
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setSelectedOrder((prev) =>
                        prev ? { ...prev, status: "cancelled" } : null
                      )
                    }
                  >
                    Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <strong>Payment Status:</strong>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="capitalize">
                    {paymentStatus || "Select status"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPaymentStatus("paid")}>
                    Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaymentStatus("unpaid")}>
                    Unpaid
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p><strong>Total:</strong> ${selectedOrder?.total_amount.toFixed(2)}</p>
            <p>
              <strong>Created:</strong>{" "}
              {selectedOrder?.created_at
                ? formatDate(selectedOrder.created_at)
                : "—"}
            </p>
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
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name ?? "Unknown Product"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            {!isOrderCancelled && (
              <LoadingButton onClick={handleUpdateOrder} isLoading={isSaving} loadingText="Saving...">
                Save Changes
              </LoadingButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
