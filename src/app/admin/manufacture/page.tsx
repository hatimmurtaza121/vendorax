"use client";

import { useState, useEffect, Fragment } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
import { Combobox } from "@/components/ui/combobox";
import { LoadingButton } from "@/components/ui/loading-button";
import { QuantityInput } from "@/components/ui/quantity-input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2Icon } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  unit: string;
  in_stock: number;
}

interface MaterialRow {
  productId: number;
  quantity: number;
}

type SectionProps = {
  title: string;
  items: MaterialRow[];
  setItems: React.Dispatch<React.SetStateAction<MaterialRow[]>>;
  products: Product[];
  errors?: string[];
};

function Section({
  title,
  items,
  setItems,
  products,
  errors = [],
}: SectionProps) {
  
  return (
    <Card>
      <CardHeader className="container mx-auto p-6">
        <CardTitle>{title}</CardTitle>
        <Combobox
          items={products}
          placeholder={`Select ${title}`}
          noSelect
          onSelect={(val) => {
            const id = Number(val);
            if (!items.some((i) => i.productId === id)) {
              setItems([...items, { productId: id, quantity: 1 }]);
            }
          }}
          className="!mt-5"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ productId, quantity }, idx) => {
              const p = products.find((pr) => pr.id === productId)!;
              return (
                <Fragment key={productId}>
                  <TableRow>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <span>
                        {p.description && p.description.length > 50
                          ? `${p.description.slice(0, 50)}…`
                          : p.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <QuantityInput
                        defaultValue={quantity}
                        min={1}
                        onChange={(val) =>
                          setItems((items) =>
                            items.map((r) =>
                              r.productId === productId ? { ...r, quantity: val } : r
                            )
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>{p.in_stock}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setItems(
                            items.filter((r) => r.productId !== productId)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>

                  {errors[idx] && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-red-600">
                        {errors[idx]}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function ManufacturePage() {
  const supabase = createClientComponentClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [rawItems, setRawItems] = useState<MaterialRow[]>([]);
  const [finishedItems, setFinishedItems] = useState<MaterialRow[]>([]);
  const [rawErrors, setRawErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManufacturing, setIsManufacturing] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => {
      setLoading(false);
    });
    
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(res.statusText);
      const data: Product[] = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManufacture = async () => {
    if (!rawItems.length || !finishedItems.length) {
      setError("Add at least one raw and one finished product.");
      return;
    }

    setRawErrors([]);
    // raw-materials validation
    const newErrors = rawItems.map((r) => {
      const p = products.find((pr) => pr.id === r.productId)!;
      return r.quantity > p.in_stock
        ? `Quantity exceeds available stock (${p.in_stock}).`
        : "";
    });

    if (newErrors.some((msg) => msg !== "")) {
      setRawErrors(newErrors);
      return;
    }

    setError(null);
    try {
      setIsManufacturing(true);
      const res = await fetch("/api/manufacture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawMaterials: rawItems,
          finishedProducts: finishedItems,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      setRawItems([]);
      setFinishedItems([]);
      setRawErrors([]);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsManufacturing(false);
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
    <div className="space-y-8">
      <Section
        title="Raw Materials"
        items={rawItems}
        setItems={setRawItems}
        products={products}
        errors={rawErrors}
      />

      <Section
        title="Finished Products"
        items={finishedItems}
        setItems={setFinishedItems}
        products={products}
      />
      {error && (
        <div className="mt-4 text-red-600 font-medium border border-red-400 bg-red-100 p-2 rounded">
          {error}
        </div>
      )}

      <div className="text-leftt">
        <LoadingButton 
          onClick={handleManufacture} 
          isLoading={isManufacturing}
          loadingText="Manufacturing..."
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Manufacture
        </LoadingButton>
      </div>
    </div>
  );
}
