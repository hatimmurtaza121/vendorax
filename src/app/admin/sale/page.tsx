"use client";
import React, { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuantityInput } from "@/components/ui/quantity-input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { PlusCircle, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Types

type Product = {
  id: number;
  name: string;
  description?: string;
  unit?: string;
  in_stock?: number;
  price: number;
};

type account = {
  id: number;
  name: string;
  type: string;
};

interface SALEProduct extends Product {
  quantity: number;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setaccounts] = useState<account[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SALEProduct[]>([]);
  const [selectedaccount, setSelectedaccount] = useState<account | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productErrors, setProductErrors] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      setLoading(false);
    });

    fetchProducts();
    fetchaccounts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchaccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setaccounts(data.filter((acc: account) => acc.type === "customer"));
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleSelectProduct = (productId: number | string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
  
    const alreadyExists = selectedProducts.some((p) => p.id === productId);
    if (alreadyExists) return;
  
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    setProductErrors((prev) => [...prev, ""]);
  };
  

  const handleSelectaccount = (accountId: number | string) => {
    const account = accounts.find((c) => c.id === accountId);
    if (account) {
      setSelectedaccount(account);
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const updatedProducts = selectedProducts.map((p) =>
      p.id === productId ? { ...p, quantity: newQuantity } : p
    );
    setSelectedProducts(updatedProducts);
  
    // Update error for this product
    const errors = updatedProducts.map((p) =>
      p.quantity > (p.in_stock ?? 0)
        ? `Quantity exceeds stock (${p.in_stock ?? 0})`
        : ""
    );
    setProductErrors(errors);
  };
  

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const handlePriceChange = (productId: number, newPrice: number) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.id === productId ? { ...p, price: newPrice } : p
      )
    );
  };

  const total = selectedProducts.reduce(
    (sum, p) => sum + p.price * (p.quantity || 1),
    0
  );

  const handleCreateOrder = async () => {
    setIsCreating(true);
    const newErrors = selectedProducts.map((p) =>
      p.quantity > (p.in_stock ?? 0)
        ? `Quantity exceeds stock (${p.in_stock ?? 0})`
        : ""
    );
    setProductErrors(newErrors);
    
    if (newErrors.some((e) => e !== "")) {
      setErrorMessage("Fix quantity errors before submitting.");
      setIsCreating(false);
      return;
    }
    setErrorMessage(null);
  
    let customerId: number | null = selectedaccount?.id ?? null;
  
    if (!selectedaccount) {
      setErrorMessage("Please select a customer account.");
      setIsCreating(false);
      return;
    }
    
    if (paidAmount === "" || paidAmount < 0 || paidAmount > total) {
      console.log("paidAmount =", paidAmount, typeof paidAmount);
      console.log("total =", total, typeof total);
      setErrorMessage("Paid amount must be between 0 and total.");
      setIsCreating(false);
      return;
    }
  
    // Quantity vs stock check
    const productWithStockIssue = selectedProducts.find(
      (p) => p.quantity > (p.in_stock ?? 0)
    );
    if (productWithStockIssue) {
      setErrorMessage(`Quantity for "${productWithStockIssue.name}" exceeds available stock.`);
      setIsCreating(false);
      return;
    }
  
    if (selectedProducts.length === 0) {
      setErrorMessage("Please select at least one product.");
      setIsCreating(false);
      return;
    }
  
    // Submit order
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: customerId,
          products: selectedProducts.map(p => ({
            productId: p.id,
            quantity:  p.quantity,
            price:     p.price,
          })),
          total_amount: total,
          type: "sale",
          paid_amount:   typeof paidAmount === "number" ? paidAmount : 0,
        }),
      });
      if (!response.ok) throw new Error("Failed to create order.");
  
      // Clear form
      setSelectedProducts([]);
      setSelectedaccount(null);
      setPaidAmount("");
      await fetchProducts();
    } catch (error) {
      console.error("Error creating sale order:", error);
      setErrorMessage("Failed to create sale order.");
    } finally {
      setIsCreating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap sm:flex-nowrap items-start gap-4 pb-4 items-end">
          <div className="flex-auto w-full sm:w-1/2">
            <Combobox
              items={accounts}
              placeholder="Select Customer Account"
              onSelect={handleSelectaccount}
            />
          </div>
          <div className="flex-auto w-full sm:w-1/2">
            <label htmlFor="paid_amount" className="block text-sm font-medium mb-1">
              Paid Amount:
            </label>
            <Input
              id="paid_amount"
              name="paid_amount"
              type="number"
              min={0}
              value={paidAmount}
              onChange={e => {
                const v = e.target.value
                if (v === "") {
                  setPaidAmount("")
                } else {
                  const num = parseFloat(v)
                  setPaidAmount(num < 0 ? 0 : num)
                }
              }}
              placeholder="Paid Amount"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <Combobox
            items={products}
            placeholder="Select Product"
            noSelect
            onSelect={handleSelectProduct}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product, idx) => (
              <Fragment key={product.id}>
                <TableRow>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description || "-"}</TableCell>
                  <TableCell>
                    <QuantityInput
                      defaultValue={product.price}
                      min={0}
                      className="w-20 p-1 border rounded"
                      onChange={(val) => handlePriceChange(product.id, val)}
                    />
                  </TableCell>
                  <TableCell>
                    <QuantityInput
                      defaultValue={product.quantity || 1}
                      min={1}
                      className={`w-16 p-1 border rounded ${
                        product.quantity > (product.in_stock ?? Infinity) ? "border-red-500" : ""
                      }`}
                      onChange={(val) => handleQuantityChange(product.id, val)}
                    />
                  </TableCell>
                  <TableCell>{product.unit || "-"}</TableCell>
                  <TableCell>{product.in_stock ?? "-"}</TableCell>
                  <TableCell>Rs {((product.quantity || 1) * product.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>

                {productErrors[idx] && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-red-600">
                      {productErrors[idx]}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}

            </TableBody>
          </Table>
          <div className="mt-4 text-right">
            <strong>Total: Rs {total.toFixed(2)}</strong>
          </div>
          {errorMessage && (
            <div className="mt-4 text-red-600 font-medium border border-red-400 bg-red-100 p-2 rounded">
              {errorMessage}
            </div>
          )}
          <div className="mt-4">
            <LoadingButton
              onClick={handleCreateOrder}
              isLoading={isCreating}
              loadingText="Creating..."
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Order
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
