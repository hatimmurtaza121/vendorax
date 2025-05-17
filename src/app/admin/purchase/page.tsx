"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description?: string;
  unit?: string;
  in_stock: number;
  price: number;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

interface PurchaseProduct extends Product {
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  originalSellPrice: number;
}

export default function PurchasePage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<PurchaseProduct[]>([]);
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  
  useEffect(() => {
    fetchProducts();
    fetchAccounts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select();
    if (!error && data) setProducts(data);
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select()
      .eq("type", "supplier");
    if (!error && data) {
      const unknown = data.find(
        (acc) => acc.name.toLowerCase() === "unknown supplier"
      );
      setAccounts(data);
      setSelectedAccount(unknown || null);
    }
  };

  const handleSelectProduct = (productId: string | number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const alreadyExists = items.some((p) => p.id === productId);
    if (alreadyExists) return;

    setItems([
      ...items,
      {
        ...product,
        quantity: 1,
        buyPrice: 0,
        sellPrice: product.price,
        originalSellPrice: product.price,
      },
    ]);
  };

  const handleSelectAccount = (accountId: string | number) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) setSelectedAccount(acc);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setItems(
      items.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handlePriceChange = (productId: number, newPrice: number) => {
    setItems(
      items.map((p) =>
        p.id === productId ? { ...p, sellPrice: newPrice } : p
      )
    );
  };

  const handleBuyPriceChange = (productId: number, newPrice: number) => {
    setItems(
      items.map((p) =>
        p.id === productId ? { ...p, buyPrice: newPrice } : p
      )
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setItems(items.filter((p) => p.id !== productId));
  };

  const total = items.reduce((sum, p) => sum + p.buyPrice * p.quantity, 0);

  const handleSubmitPurchaseOrder = async () => {
    setIsPurchasing(true);
    setErrorMessage(null);

    if (!selectedAccount) {
      setErrorMessage("Please select a supplier account.");
      setIsPurchasing(false);
      return;
    }

    if (paidAmount === "" || paidAmount < 0 || paidAmount > total) {
      setErrorMessage("Paid amount must be between 0 and total.");
      setIsPurchasing(false);
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Please select at least one product.");
      setIsPurchasing(false);
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          products: items.map((p) => ({
            productId: p.id,
            quantity: p.quantity,
            price: p.buyPrice,
            sellPrice: p.sellPrice,
          })),
          total_amount: total,
          type: "purchase",
          paid_amount: typeof paidAmount === "number" ? paidAmount : 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to create purchase order");

      setItems([]);
      setSelectedAccount(null);
      setResetKey((prev) => prev + 1);
      setPaidAmount("");
      await fetchProducts();
    } catch (error) {
      setErrorMessage("Error creating purchase order.");
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap sm:flex-nowrap items-start gap-4 py-4 items-end">
          <div className="flex-auto w-full sm:w-1/2">
            <Combobox
              key={resetKey}
              items={accounts}
              placeholder="Select Supplier Account"
              onSelect={(id) => {
                setErrorMessage(null);
                handleSelectAccount(id);
              }}
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
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setPaidAmount("");
                } else {
                  const num = parseFloat(v);
                  setPaidAmount(num < 0 ? 0 : num);
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
            onSelect={(id) => {
              setErrorMessage(null);
              handleSelectProduct(id);
            }}
            className={`!mt-5`}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Buy Price</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description || "-"}</TableCell>
                  <TableCell>
                    <QuantityInput
                      defaultValue={product.buyPrice}
                      min={0}
                      className="w-20 p-1 border rounded"
                      onChange={(val) => handleBuyPriceChange(product.id, val)}
                    />
                  </TableCell>
                  <TableCell>
                    <QuantityInput
                      defaultValue={product.sellPrice}
                      min={0}
                      className="w-20 p-1 border rounded"
                      onChange={(val) => handlePriceChange(product.id, val)}
                    />
                  </TableCell>
                  <TableCell>
                    <QuantityInput
                      defaultValue={product.quantity}
                      min={1}
                      className="w-16 p-1 border rounded"
                      onChange={(val) => handleQuantityChange(product.id, val)}
                    />
                  </TableCell>
                  <TableCell>{product.unit || "-"}</TableCell>
                  <TableCell>{product.in_stock ?? "-"}</TableCell>
                  <TableCell>Rs {(product.quantity * product.buyPrice).toFixed(2)}</TableCell>
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
              onClick={handleSubmitPurchaseOrder}
              isLoading={isPurchasing}
              loadingText="Purchasing..."
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit Purchase
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
