"use client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  TrashIcon,
  PlusCircle,
  LoaderIcon,
  Loader2Icon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

interface Product {
  id: number;
  name: string;
  unit: string;
  description: string;
  price: number;
  cost_price: number;
  in_stock: number;
  category: string;
}

export default function Products() {
  const [unit, setUnit] = useState("pcs");
  const [customUnit, setCustomUnit] = useState("");
  const categories = [
    { value: 'dry_fruits', label: 'Dry Fruits' },
    { value: 'spices', label: 'Spices' },
    { value: 'food_grocery', label: 'Food & Grocery' },
    { value: 'personal_care', label: 'Personal Care' },
    { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
    { value: 'stationery', label: 'Stationery' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'others', label: 'Others' }
  ];
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<{ category: string[]; inStock: string[] }>({
    category: ["all"],
    inStock: ["all"],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productCostPrice, setProductCostPrice] = useState(0);
  const [productInStock, setProductInStock] = useState(0);
  const [productCategory, setProductCategory] = useState("");
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const searchParams = useSearchParams();

  const resetSelectedProduct = () => {
    setSelectedProductId(null);
    setProductName("");
    setProductDescription("");
    setProductPrice(0);
    setProductCostPrice(0);
    setProductInStock(0);
    setProductCategory("");
  };

  const handleAddProduct = useCallback(async () => {
    if (!productName.trim() || !productCategory) {
      setErrorMessage("Product name and category are required.");
      return;
    }
    setErrorMessage("");
    setSubmitLoading(true);
    try {
      const newProduct = {
        name: productName,
        description: productDescription,
        price: productPrice,
        cost_price: productCostPrice,
        in_stock: productInStock,
        category: productCategory,
        unit: unit === "other" ? customUnit : unit,
      };
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const addedProduct = await response.json();
        setProducts([...products, addedProduct]);
        setIsAddProductDialogOpen(false);
        resetSelectedProduct();
      } else {
        console.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setSubmitLoading(false);
    }
  }, [productName, productDescription, productPrice, productInStock, productCategory, products]);

  const handleEditProduct = useCallback(async () => {
    if (!selectedProductId) return;
    setSubmitLoading(true);
    try {
      const updatedProduct = {
        id: selectedProductId,
        name: productName,
        description: productDescription,
        price: productPrice,
        cost_price: productCostPrice,
        in_stock: productInStock,
        category: productCategory,
        unit: unit === "other" ? customUnit : unit,
      };

      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const updatedProductFromServer = await response.json();
        setProducts(
          products.map((p) =>
            p.id === updatedProductFromServer.id ? updatedProductFromServer : p
          )
        );
        setIsEditProductDialogOpen(false);
        resetSelectedProduct();
      } else {
        console.error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setSubmitLoading(false);
    }
  }, [selectedProductId, productName, productDescription, productPrice, productInStock, productCategory, unit, customUnit, products,]);

  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete || !productToDelete.id) {
      console.warn('No valid product selected for deletion');
      return;
    }
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productToDelete.id));
        setIsDeleteConfirmationOpen(false);
        setProductToDelete(null);
      } else {
        console.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }, [productToDelete, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "low-stock") {
      setFilters((prev) => ({ ...prev, inStock: ["low-stock"] }));
    } else if (filterParam === "out-of-stock") {
      setFilters((prev) => ({ ...prev, inStock: ["out-of-stock"] }));
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (!filters.category.includes("all") && !filters.category.includes(product.category)) {
        return false;
      }
      // Stock filter
      if (!filters.inStock.includes("all")) {
        if (filters.inStock.includes("in-stock") && product.in_stock > 0) {
          // pass
        } else if (filters.inStock.includes("out-of-stock") && product.in_stock === 0) {
          // pass
        } else if (filters.inStock.includes("low-stock") && product.in_stock > 0 && product.in_stock < 5) {
          // pass
        } else {
          return false;
        }
      }
      // Search filter
      if (!product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [products, filters.category, filters.inStock, searchTerm]);


  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: "category" | "inStock", value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
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
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock.includes("all")}
                    onCheckedChange={() => handleFilterChange("inStock", "all")}
                  >
                    All Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock.includes("in-stock")}
                    onCheckedChange={() => handleFilterChange("inStock", "in-stock")}
                  >
                    In Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock.includes("out-of-stock")}
                    onCheckedChange={() => handleFilterChange("inStock", "out-of-stock")}
                  >
                    Out of Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock.includes("low-stock")}
                    onCheckedChange={() => handleFilterChange("inStock", "low-stock")}
                  >
                    Low Stock (&lt;5)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.category.includes("all")}
                    onCheckedChange={() => handleFilterChange("category", "all")}
                  >
                    All Categories
                  </DropdownMenuCheckboxItem>
                  {categories
                    .filter(cat => products.some(p => p.category === cat.value))
                    .map((cat) => (
                      <DropdownMenuCheckboxItem
                        key={cat.value}
                        checked={filters.category.includes(cat.value)}
                        onCheckedChange={() => handleFilterChange("category", cat.value)}
                      >
                        {cat.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>Rs {product.price.toFixed(2)}</TableCell>
                    <TableCell>Rs {(product.cost_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{product.in_stock}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-gray-100 transition rounded-full"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductName(product.name);
                            setProductDescription(product.description);
                            setProductPrice(product.price);
                            setProductCostPrice(product.cost_price);
                            setProductInStock(product.in_stock);
                            setProductCategory(product.category);
                            const defaultUnits = ["pcs", "kg", "g", "ft"];
                            setUnit(defaultUnits.includes(product.unit) ? product.unit : "other");
                            setCustomUnit(!defaultUnits.includes(product.unit) ? product.unit : "");
                            setIsEditProductDialogOpen(true);
                          }}
                        >
                          <FilePenIcon className="w-5 h-5 text-gray-500 hover:text-blue-600 transition" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-red-100 transition rounded-full"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteConfirmationOpen(true);
                          }}
                        >
                          <TrashIcon className="w-5 h-5 text-red-500 hover:text-red-700 transition" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          <div className="flex gap-2 flex-wrap justify-center">
            {/* Prev Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </Button>

            {/* Mobile View: Smart Pagination (max 3 pages + first/last + ellipsis) */}
            <div className="flex gap-1 md:hidden">
              {currentPage > 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </Button>
                  {currentPage > 3 && <span className="px-1 text-gray-500">...</span>}
                </>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => Math.abs(page - currentPage) <= 1)
                .map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}

              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <span className="px-1 text-gray-500">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            {/* Desktop: Smart Pagination (show 10 pages max) */}
            <div className="hidden md:flex gap-1 flex-wrap justify-center">
              {currentPage > 6 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </Button>
                  {currentPage > 7 && <span className="px-1 text-gray-500">...</span>}
                </>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => Math.abs(page - currentPage) <= 5)
                .map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}

              {currentPage < totalPages - 5 && (
                <>
                  {currentPage < totalPages - 6 && (
                    <span className="px-1 text-gray-500">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>


            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </CardFooter>

      </Card>
      <Dialog
        open={isAddProductDialogOpen || isEditProductDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddProductDialogOpen(false);
            setIsEditProductDialogOpen(false);
            resetSelectedProduct();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>
              {isAddProductDialogOpen ? "Add New Product" : "Edit Product"}
            </DialogTitle>
            <DialogDescription>
              {isAddProductDialogOpen
                ? "Enter the details of the new product."
                : "Edit the details of the product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Selling Price
              </Label>
              <Input
                id="price"
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost_price" className="text-right">
                Cost Price
              </Label>
              <Input
                id="cost_price"
                type="number"
                value={productCostPrice}
                onChange={(e) => setProductCostPrice(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="in_stock" className="text-right">
                Stock
              </Label>
              <span className="col-span-3 text-gray-700">0</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="col-span-1">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {unit === "other" && (
                <Input
                  type="text"
                  placeholder="Enter custom unit"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="col-span-2"
                />
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={productCategory}
                onValueChange={(value) => setProductCategory(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <div className="flex flex-col items-end w-full gap-5">
              {errorMessage && (
                <p className="text-red-600 font-medium border border-red-400 bg-red-100 p-2 rounded w-full text-center">
                  {errorMessage}
                </p>
              )}
              <LoadingButton
                onClick={isAddProductDialogOpen ? handleAddProduct : handleEditProduct}
                isLoading={submitLoading}
                loadingText={isAddProductDialogOpen ? "Adding..." : "Updating..."}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                {isAddProductDialogOpen ? "Add Product" : "Update Product"}
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmationOpen(open);
          if (!open) {
            setProductToDelete(null);  // just clear the product
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Suspense>
  );
}
