"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FilterIcon,
  FilePenIcon,
  TrashIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

type Account = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  type: "customer" | "supplier"; // ADD THIS
};

export default function AccountsPage() {
  const [customers, setCustomers] = useState<Account[]>([]);
  const [suppliers, setSuppliers] = useState<Account[]>([]);
  // const [accounts, setaccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shownewAccountDialog, setShownewAccountDialog] = useState(false);
  const [newAccountName, setnewAccountName] = useState("");
  const [newAccountEmail, setnewAccountEmail] = useState("");
  const [newAccountPhone, setnewAccountPhone] = useState("");
  const [newAccountStatus, setnewAccountStatus] = useState<"active" | "inactive">("active");
const [newAccountType, setnewAccountType] = useState<"customer" | "supplier">("customer");

  const [isEditaccountDialogOpen, setIsEditaccountDialogOpen] =
    useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [accountToDelete, setaccountToDelete] = useState<Account | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [selectedaccountId, setSelectedaccountId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const customersResponse = await fetch("/api/accounts?type=customer");
        const suppliersResponse = await fetch("/api/accounts?type=supplier");

        if (!customersResponse.ok || !suppliersResponse.ok) {
          throw new Error("Failed to fetch accounts");
        }

        const customersData = await customersResponse.json();
        const suppliersData = await suppliersResponse.json();

        setCustomers(customersData);  // store customers separately
        setSuppliers(suppliersData);  // store suppliers separately
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);


  const filteredCustomers = useMemo(() => {
    return customers.filter((account) => {
      if (filters.status !== "all" && account.status !== filters.status) return false;
      return (
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.phone.includes(searchTerm)
      );
    });
  }, [customers, filters.status, searchTerm]);
  
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((account) => {
      if (filters.status !== "all" && account.status !== filters.status) return false;
      return (
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.phone.includes(searchTerm)
      );
    });
  }, [suppliers, filters.status, searchTerm]);
  

  const resetSelectedaccount = () => {
    setSelectedaccountId(null);
    setnewAccountName("");
    setnewAccountEmail("");
    setnewAccountPhone("");
    setnewAccountStatus("active");
  };

  const handleAddaccount = useCallback(async () => {
    try {
      const newAccount = {
        name: newAccountName,
        email: newAccountEmail,
        phone: newAccountPhone,
        status: newAccountStatus,
        type: newAccountType, // 'customer' or 'supplier'
      };
  
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAccount),
      });
  
      if (!response.ok) throw new Error("Error creating account");
  
      const createdAccount = await response.json();
  
      if (createdAccount.type === "customer") {
        setCustomers((prev) => [...prev, createdAccount]);
      } else {
        setSuppliers((prev) => [...prev, createdAccount]);
      }
  
      setShownewAccountDialog(false);
      resetSelectedaccount();
    } catch (error) {
      console.error(error);
    }
  }, [
    newAccountName,
    newAccountEmail,
    newAccountPhone,
    newAccountStatus,
    newAccountType,
  ]);
  

  const handleEditaccount = useCallback(async () => {
    if (!selectedaccountId) return;
    try {
      const updatedAccount = {
        name: newAccountName,
        email: newAccountEmail,
        phone: newAccountPhone,
        status: newAccountStatus,
        type: newAccountType,
      };
  
      const response = await fetch(`/api/accounts/${selectedaccountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAccount),
      });
  
      if (!response.ok) throw new Error("Error updating account");
  
      const updatedData = await response.json();
  
      if (updatedData.type === "customer") {
        setCustomers((prev) =>
          prev.map((c) => (c.id === updatedData.id ? updatedData : c))
        );
      } else {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === updatedData.id ? updatedData : s))
        );
      }
  
      setIsEditaccountDialogOpen(false);
      resetSelectedaccount();
    } catch (error) {
      console.error(error);
    }
  }, [
    selectedaccountId,
    newAccountName,
    newAccountEmail,
    newAccountPhone,
    newAccountStatus,
    newAccountType,
  ]);
  

  const handleDeleteaccount = useCallback(async () => {
    if (!accountToDelete) return;
  
    try {
      // First, check if account has any orders
      const checkOrdersResponse = await fetch(`/api/orders/check-account/${accountToDelete.id}`);
  
      if (!checkOrdersResponse.ok) {
        throw new Error("Error checking account orders");
      }
  
      const { hasOrders } = await checkOrdersResponse.json();
  
      if (hasOrders) {
        // If account is linked to orders, do not delete
        alert(`This account is associated with existing orders. You cannot delete it.\nPlease set the account status to inactive instead.`);
        setIsDeleteConfirmationOpen(false);
        setaccountToDelete(null);
        return;
      }
  
      // If no orders, proceed to delete
      const response = await fetch(`/api/accounts/${accountToDelete.id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        throw new Error("Error deleting account");
      }
  
      // Remove from UI
      if (accountToDelete.type === "customer") {
        setCustomers((prev) => prev.filter((c) => c.id !== accountToDelete.id));
      } else if (accountToDelete.type === "supplier") {
        setSuppliers((prev) => prev.filter((s) => s.id !== accountToDelete.id));
      }
  
      setIsDeleteConfirmationOpen(false);
      setaccountToDelete(null);
    } catch (error) {
      console.error(error);
    }
  }, [accountToDelete]);
  
  
  

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      status: value,
    }));
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Accounts</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search accounts..."
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
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.status === "all"}
                  onCheckedChange={() => handleFilterChange("all")}
                >
                  All Statuses
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "active"}
                  onCheckedChange={() => handleFilterChange("active")}
                >
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "inactive"}
                  onCheckedChange={() => handleFilterChange("inactive")}
                >
                  Inactive
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" onClick={() => setShownewAccountDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add account
          </Button>
        </div>
      </CardHeader>
  
      <CardContent className="p-0">
        {/* --- Customers Section --- */}
        <h2 className="text-2xl font-bold mb-4 mt-6">Customers</h2>
        <div className="overflow-x-auto mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Name</TableHead>
                <TableHead className="w-1/5">Email</TableHead>
                <TableHead className="w-1/5">Phone</TableHead>
                <TableHead className="w-1/5">Status</TableHead>
                <TableHead className="w-1/5 ">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.phone}</TableCell>
                  <TableCell>{account.status}</TableCell>
                  <TableCell>
                    <div className="flex justify gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-gray-100 transition rounded-full"
                        onClick={() => {
                          setSelectedaccountId(account.id);
                          setnewAccountName(account.name);
                          setnewAccountEmail(account.email);
                          setnewAccountPhone(account.phone);
                          setnewAccountStatus(account.status);
                          setnewAccountType(account.type as "customer" | "supplier");
                          setIsEditaccountDialogOpen(true);
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
                          setaccountToDelete(account);
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
  
        {/* --- Suppliers Section --- */}
        <h2 className="text-2xl font-bold mb-4 mt-6">Suppliers</h2>
        <div className="overflow-x-auto mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Name</TableHead>
                <TableHead className="w-1/5">Email</TableHead>
                <TableHead className="w-1/5">Phone</TableHead>
                <TableHead className="w-1/5">Status</TableHead>
                <TableHead className="w-1/5 ">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>{account.phone}</TableCell>
                  <TableCell>{account.status}</TableCell>
                  <TableCell>
                    <div className="flex justify gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-gray-100 transition rounded-full"
                        onClick={() => {
                          setSelectedaccountId(account.id);
                          setnewAccountName(account.name);
                          setnewAccountEmail(account.email);
                          setnewAccountPhone(account.phone);
                          setnewAccountStatus(account.status);
                          setnewAccountType(account.type as "customer" | "supplier");
                          setIsEditaccountDialogOpen(true);
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
                          setaccountToDelete(account);
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
  
      <CardFooter className="flex justify-between items-center">
        {/* Optional pagination if needed */}
      </CardFooter>
      {/* ADD DELETE CONFIRMATION DIALOG HERE */}
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={(open) => setIsDeleteConfirmationOpen(open)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>

          <div>Are you sure you want to delete this account?</div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteaccount}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
      <Dialog
        open={shownewAccountDialog || isEditaccountDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShownewAccountDialog(false);
            setIsEditaccountDialogOpen(false);
            resetSelectedaccount();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>
              {shownewAccountDialog ? "Create New Account" : "Edit Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newAccountName}
                onChange={(e) => setnewAccountName(e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={newAccountEmail}
                onChange={(e) => setnewAccountEmail(e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newAccountPhone}
                onChange={(e) => setnewAccountPhone(e.target.value)}
                className="col-span-3"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newAccountStatus}
                onValueChange={(value: "active" | "inactive") =>
                  setnewAccountStatus(value)
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newAccountType}
                onValueChange={(value: "customer" | "supplier") =>
                  setnewAccountType(value)
                }
              >
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShownewAccountDialog(false);
                setIsEditaccountDialogOpen(false);
                resetSelectedaccount();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={shownewAccountDialog ? handleAddaccount : handleEditaccount}
            >
              {shownewAccountDialog ? "Create Account" : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );  
}
