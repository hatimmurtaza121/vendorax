"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
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
  DownloadIcon,
  Loader2,
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
import StatusBadge from "@/components/ui/statusbadge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function generateInvoicePDF({
  company,
  order,
  items,
}: {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo_url?: string;
  };
  order: Order;
  items: (OrderItem & { description: string; unit: string })[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const padding = 14;
  let y = padding;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v);

  const total = order.total_amount;
  const paid = order.transactions?.[0]?.paid_amount || 0;
  const due = total - paid;
  const paymentStatus = order.transactions?.[0]?.status || "unpaid";

  const renderDetails = () => {
    // Top-right company info
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const infoLines = [
      company.name,
      company.address,
      company.phone,
      company.email,
    ];
    infoLines.forEach((line, i) => {
      doc.text(line, pageWidth - padding, padding + i * 5, { align: "right" });
    });

    // "Invoice" title below logo
    doc.setFont("times", "bold");
    doc.setFontSize(30);
    doc.text("Invoice", padding, y + 12);
    y += 22;

    // BILL TO
    doc.setFontSize(11);
    doc.setFont("times", "bold");
    doc.text("BILL TO:", padding, y);
    doc.setFont("times", "normal");
    doc.text(order.accounts.name || "Walk In Customer", padding, y + 5);
    y += 12;

    // Invoice meta info
    const metaLeftX = pageWidth - 60;
    const metaRightX = pageWidth - padding;

    doc.setFontSize(10);
    let currentY = y;
    const lineGap = 5;

    doc.setFont("times", "bold");
    doc.text("INVOICE #", metaLeftX, currentY);
    doc.setFont("times", "normal");
    doc.text(order.id.toString(), metaRightX, currentY, { align: "right" });

    currentY += lineGap;

    doc.setFont("times", "bold");
    doc.text("DATE", metaLeftX, currentY);
    doc.setFont("times", "normal");
    doc.text(
      new Date(order.created_at).toLocaleDateString(),
      metaRightX,
      currentY,
      { align: "right" }
    );

    currentY += lineGap;

    doc.setFont("times", "bold");
    doc.text("STATUS", metaLeftX, currentY);
    doc.setFont("times", "normal");
    doc.text(paymentStatus.toUpperCase(), metaRightX, currentY, {
      align: "right",
    });

    y = currentY + 10;


    // Table
    autoTable(doc, {
      startY: y,
      head: [["Product", "Description", "Quantity", "Unit", "Price", "Amount"]],
      body: items.map((item) => {
        const amount = (item.quantity ?? 0) * (item.price ?? 0);
        const desc = item.description ?? "-";

        return [
          item.product?.name ?? "-",
          desc.length > 20 ? desc.slice(0, 20) + "…" : desc,
          item.quantity?.toString() ?? "0",
          item.unit ?? "pcs",
          formatCurrency(item.price ?? 0),
          formatCurrency(amount),
        ];
      }),
      styles: {
        font: "times",
        fontSize: 11,
        cellPadding: 3,
        lineWidth: 0, // no borders
      },
      headStyles: {
        fillColor: [45, 45, 45],
        textColor: 255,
        fontStyle: "bold",
      },
      theme: "plain",
    });

    const finalY = (doc as any).lastAutoTable?.finalY || y + 10;
    y = finalY + 10;

    // Totals - aligned labels and values
    const labelX = pageWidth - 60;
    const valueX = pageWidth - padding;
    const labelFontSize = 12;
    const lineHeight = 10; // reduced from 14 to tighten spacing

    doc.setFont("times", "bold");
    doc.setFontSize(labelFontSize);
    doc.text(`TOTAL: ${formatCurrency(total)}`, valueX, y, { align: "right" });

    doc.setFont("times", "normal");
    doc.text(`Paid Amount: ${formatCurrency(paid)}`, valueX, y + lineHeight, { align: "right" });
    doc.text(`Amount Due: ${formatCurrency(due)}`, valueX, y + lineHeight * 2, { align: "right" });


    // Footer
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(130, 130, 130);
    doc.text(
      "Thank you for your business!",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0); // reset
  };

  // Load logo first, then render
  if (company.logo_url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = company.logo_url;
    img.onload = () => {
      const maxWidth = 50; // optional constraint to avoid overly large logos
      const maxHeight = 30;

      let { width, height } = img;

      // Optional: scale proportionally if it exceeds max
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width *= scale;
        height *= scale;
      }

      doc.addImage(img, "PNG", padding, y, width, height);
      y += height + 5;
      renderDetails();
      doc.save(`invoice_order_${order.id}.pdf`);
    };
    img.onerror = () => {
      renderDetails();
      doc.save(`invoice_order_${order.id}.pdf`);
    };
  } else {
    renderDetails();
    doc.save(`invoice_order_${order.id}.pdf`);
  }
}



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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nextPaymentError, setNextPaymentError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ status: string[]; type: string[]; orderStatus: string[] }>({
    status: ["all"],
    type: ["all"],
    orderStatus: ["all"],
  });
  const [company, setCompany] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchAll() {
    try {
      const [ordersRes, accountsRes, companyRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/accounts"),
        fetch("/api/settings")
      ]);

      const [ordersData, accountsData] = await Promise.all([
        ordersRes.json(),
        accountsRes.json()
      ]);

      setOrders(ordersData);
      setAccounts(accountsData);

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }
    } catch {
      setError("Error loading data");
    } finally {
      setLoading(false);
    }
  }
    fetchAll();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get("filter");
      if (filterParam === "credit") {
        setFilters({ status: ["unpaid", "partial"], type: ["income"], orderStatus: ["all"] });
      } else if (filterParam === "debit") {
        setFilters({ status: ["unpaid", "partial"], type: ["expense"], orderStatus: ["all"] });
      }
    }
  }, [router]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Payment status
      const statusMatch =
        filters.status.includes("all") ||
        (order.transactions && filters.status.includes(order.transactions[0]?.status));
      // Type
      const typeMatch =
        filters.type.includes("all") || filters.type.includes(order.type);
      // Order status
      const orderStatusMatch =
        filters.orderStatus.includes("all") || filters.orderStatus.includes(order.status);
      // Search
      const searchMatch =
        !searchTerm || order.accounts?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && typeMatch && orderStatusMatch && searchMatch;
    });
  }, [orders, filters.status, filters.type, filters.orderStatus, searchTerm]);

  const handleCreateRedirect = () => router.push("/admin/sale");

  const handleFilterChange = (key: "status" | "type" | "orderStatus", value: string) => {
    setFilters((prev) => {
      if (value === "all") {
        return { ...prev, [key]: ["all"] };
      }
      const arr = prev[key];
      if (arr.includes(value)) {
        const filtered = arr.filter((v) => v !== value);
        return { ...prev, [key]: filtered.length === 0 ? ["all"] : filtered };
      } else {
        const filtered = arr.filter((v) => v !== "all");
        return { ...prev, [key]: [...filtered, value] };
      }
    });
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

  const handleDownloadInvoice = async (order: Order) => {
    try {
      setDownloadingId(order.id);
      const res = await fetch(`/api/orders/${order.id}/items`);
      const items = await res.json();

      const productIds = items.map((i: { product_id: any }) => i.product_id);
      const res2 = await fetch(`/api/products?ids=${productIds.join(",")}`);
      const products = await res2.json();

      const enrichedItems = items.map((item: { product_id: any }) => {
        const match = products.find((p: { id: any }) => p.id === item.product_id);
        return {
          ...item,
          description: match?.description || "—",
          unit: match?.unit || "pcs"
        };
      });

      generateInvoicePDF({
        company,
        order,
        items: enrichedItems, // now includes description + unit
      });
    } catch (err) {
      console.error("Failed to generate invoice:", err);
    } finally {
      setDownloadingId(null);
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
      setNextPaymentError(`Payment cannot exceed Rs ${amountLeft.toFixed(2)}.`);
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

      const newStatus =
        newPaid >= selectedOrder.total_amount
          ? "paid"
          : newPaid === 0
          ? "unpaid"
          : "partial";
          
      // update local state
      setOrders(prev =>
        prev.map(o =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: selectedOrder.status,
                transactions: [{ ...o.transactions![0], paid_amount: newPaid, status: newStatus }]
              }
            : o
        )
      );
      setSelectedOrder(o =>
        o
          ? {
              ...o,
              status: selectedOrder.status,
              transactions: [{ ...o.transactions![0], paid_amount: newPaid, status: newStatus }]
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
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by account..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pr-8"
                />
                <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <FilterIcon className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Type Filter */}
                  <DropdownMenuLabel className="mt-2">Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["all", "sale", "purchase"].map((tp) => (
                    <DropdownMenuCheckboxItem
                      key={`type-${tp}`}
                      checked={filters.type.includes(tp)}
                      onCheckedChange={() => handleFilterChange("type", tp)}
                    >
                      {tp.charAt(0).toUpperCase() + tp.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {/* Payment Status Filter */}
                  <DropdownMenuLabel>Filter by Payment Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["all", "paid", "unpaid", "partial"].map((st) => (
                    <DropdownMenuCheckboxItem
                      key={`status-${st}`}
                      checked={filters.status.includes(st)}
                      onCheckedChange={() => handleFilterChange("status", st)}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {/* Order Status Filter */}
                  <DropdownMenuLabel>Filter by Order Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["all", "completed", "pending", "cancelled"].map((os) => (
                    <DropdownMenuCheckboxItem
                      key={`orderStatus-${os}`}
                      checked={filters.orderStatus.includes(os)}
                      onCheckedChange={() => handleFilterChange("orderStatus", os)}
                    >
                      {os.charAt(0).toUpperCase() + os.slice(1)}
                    </DropdownMenuCheckboxItem>
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
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell>Rs {o.total_amount.toFixed(2)}</TableCell>
                    <TableCell>Rs {left.toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge type="paymentStatus" value={o.transactions?.[0]?.status || 'unpaid'} />
                    </TableCell>
                    <TableCell>{formatDate(o.created_at)}</TableCell>
                    <TableCell>
                      <StatusBadge type="orderStatus" value={o.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="orderType" value={o.type} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button size="icon" variant="ghost" className="hover:bg-blue-100 transition rounded-full" onClick={()=>handleViewOrder(o)}>
                          <EyeIcon className="w-5 h-5 text-gray-500 hover:text-blue-600 transition"/>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-green-100 ml-1 transition rounded-full"
                          onClick={() => handleDownloadInvoice(o)}
                          disabled={downloadingId === o.id}
                        >
                          {downloadingId === o.id ? (
                            <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                          ) : (
                            <DownloadIcon className="w-5 h-5 text-green-600 hover:text-green-800 transition" />
                          )}
                        </Button>
                      </div>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
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
            <p><strong>Amount Left:</strong> Rs {( (selectedOrder?.total_amount||0) - (selectedOrder?.transactions?.[0]?.paid_amount||0) ).toFixed(2)}</p>
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
            <p><strong>Total:</strong> Rs {selectedOrder?.total_amount.toFixed(2)}</p>
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
                {orderItems.map(item=><TableRow key={item.id}><TableCell>{item.product.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>Rs {item.price.toFixed(2)}</TableCell></TableRow>)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete order #{selectedOrder?.id}? This cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              onClick={() => setShowDeleteConfirm(false)} 
              variant="outline"
              disabled={isDeleting}
            >
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
