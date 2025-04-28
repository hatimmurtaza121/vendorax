"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";

type Product = {
  id: number;
  name: string;
  price: number;
};

type account = {
  id: number;
  name: string;
  type: string;
};

type PaymentMethod = {
  id: number;
  name: string;
};

interface POSProduct extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setaccounts] = useState<account[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<POSProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedaccount, setSelectedaccount] = useState<account | null>(null);
  
  const paymentStatuses = [
    { id: "paid", name: "Paid" },
    { id: "unpaid", name: "Unpaid" },
  ];
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchaccounts();
    fetchPaymentMethods();
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
      const customerAccounts = data.filter((acc: account) => acc.type === "customer");
      setaccounts(customerAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleSelectProduct = (productId: number | string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (selectedProducts.some((p) => p.id === productId)) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleSelectaccount = (accountId: number | string) => {
    const account = accounts.find((c) => c.id === accountId);
    if (account) {
      setSelectedaccount(account);
    }
  };

  const handleSelectPaymentMethod = (paymentMethodId: number | string) => {
    const method = paymentMethods.find((pm) => pm.id === paymentMethodId);
    if (method) {
      setPaymentMethod(method);
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
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
    if (!selectedaccount || !paymentMethod || !paymentStatus || selectedProducts.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: selectedaccount.id,
          paymentMethodId: paymentMethod.id,
          products: selectedProducts.map(p => ({
            id: p.id,
            quantity: p.quantity,
            price: p.price
          })),
          total,
          paymentStatus, // <- new
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const order = await response.json();

      // Reset
      setSelectedProducts([]);
      setSelectedaccount(null);
      setPaymentMethod(null);
      setPaymentStatus(null);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4 py-4">
          <div className="flex-auto w-full sm:w-1/3">
            <Combobox
              items={accounts}
              placeholder="Select Customer Account"
              onSelect={handleSelectaccount}
            />
          </div>
          <div className="flex-auto w-full sm:w-1/3">
            <Combobox
              items={paymentMethods}
              placeholder="Select Payment Method"
              onSelect={handleSelectPaymentMethod}
            />
          </div>
          <div className="flex-auto w-full sm:w-1/3">
            <Combobox
              items={paymentStatuses}
              placeholder="Select Payment Status"
              onSelect={(statusId) => {
                setPaymentStatus(statusId.toString());
              }}
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
            className="!mt-5"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  {/* Edit price */}
                  <TableCell>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.price}
                      onChange={e =>
                        handlePriceChange(
                          product.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 p-1 border rounded"
                    />
                  </TableCell>
                  {/* Quantity */}
                  <TableCell>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity || 1}
                      onChange={(e) =>
                        handleQuantityChange(
                          product.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-16 p-1 border rounded"
                    />
                  </TableCell>
                  <TableCell>
                    ${((product.quantity || 1) * product.price).toFixed(2)}
                  </TableCell>
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
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
          <div className="mt-4">
            <Button onClick={handleCreateOrder} disabled={selectedProducts.length === 0 || !selectedaccount || !paymentMethod}>
              Create Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
