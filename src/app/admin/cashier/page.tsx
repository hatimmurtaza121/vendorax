"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FilePenIcon, 
  TrashIcon,
  PlusCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EllipsisVerticalIcon, Loader2Icon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type TransactionType = "income" | "expense";

interface Transaction {
  id: number;
  description: string;
  type: TransactionType;
  category: string;
  created_at: string;
  paid_amount: number;
  amount: number;
  status: string;
}

export default function Cashier() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    description: "",
    category: "",
    type: "income",
    paid_amount: 0,
    amount: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? parseFloat(value) : value;
    setNewTransaction((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const computeStatus = () => {
    const paid = newTransaction.paid_amount || 0;
    const total = newTransaction.amount || 0;
    if (paid >= total) return "paid";
    if (paid <= 0) return "unpaid";
    return "partial";
  };

  const handleAddTransaction = async () => {
    try {
      const payload = {
        ...newTransaction,
      };
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const addedTransaction = await response.json();
        setTransactions((prev) => [...prev, addedTransaction]);
        setNewTransaction({ description: "", category: "", type: "income", paid_amount: 0, amount: 0 });
      } else {
        console.error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDeleteTransaction = useCallback(async () => {
    if (!transactionToDelete) return;
    try {
      const response = await fetch(
        `/api/transactions/${transactionToDelete.id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
        setIsDeleteConfirmationOpen(false);
        setTransactionToDelete(null);
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }, [transactionToDelete]);

  const handleEditTransaction = async () => {
    if (!transactionToEdit) return;
  
    try {
      const response = await fetch(`/api/transactions/${transactionToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionToEdit),
      });
  
      if (response.ok) {
        const updated = await response.json();
        setTransactions((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        setIsEditDialogOpen(false);
        setTransactionToEdit(null);
      } else {
        console.error("Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };
  

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Manage your transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type}>{transaction.type}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  <TableCell>${transaction.paid_amount.toFixed(2)}</TableCell>
                  <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "paid" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Edit Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-gray-100 transition rounded-full"
                        onClick={() => {
                          setTransactionToEdit(transaction);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <FilePenIcon className="w-5 h-5 text-gray-500 hover:text-blue-600 transition" />
                      </Button>

                      {/* Delete Button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-red-100 transition rounded-full"
                        onClick={() => {
                          setTransactionToDelete(transaction);
                          setIsDeleteConfirmationOpen(true);
                        }}
                      >
                        <TrashIcon className="w-5 h-5 text-red-500 hover:text-red-700 transition" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>New</TableCell>
                <TableCell>
                  <Input
                    name="description"
                    value={newTransaction.description}
                    onChange={handleInputChange}
                    placeholder="Description"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    name="category"
                    value={newTransaction.category}
                    onChange={handleInputChange}
                    placeholder="Category"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={newTransaction.type}
                    onValueChange={(value) =>
                      setNewTransaction((prev) => ({ ...prev, type: value as TransactionType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatDate(new Date().toISOString())}</TableCell>
                <TableCell>
                  <Input
                    name="paid_amount"
                    type="number"
                    value={newTransaction.paid_amount}
                    onChange={handleInputChange}
                    placeholder="Paid Amount"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    name="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={handleInputChange}
                    placeholder="Total Amount"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={computeStatus() === "paid" ? "default" : "secondary"}>
                    {computeStatus()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button onClick={handleAddTransaction}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        {/* Remove card footer */}
      </Card>
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        {transactionToEdit && (
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                name="description"
                value={transactionToEdit.description}
                onChange={(e) =>
                  setTransactionToEdit({ ...transactionToEdit, description: e.target.value })
                }
                placeholder="Description"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium">
                Category
              </label>
              <Input
                id="category"
                name="category"
                value={transactionToEdit.category}
                onChange={(e) =>
                  setTransactionToEdit({ ...transactionToEdit, category: e.target.value })
                }
                placeholder="Category"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium">
                Type
              </label>
              <Select
                value={transactionToEdit.type}
                onValueChange={(value) =>
                  setTransactionToEdit({ ...transactionToEdit, type: value as TransactionType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paid Amount */}
            <div>
              <label htmlFor="paid_amount" className="block text-sm font-medium">
                Paid Amount
              </label>
              <Input
                id="paid_amount"
                name="paid_amount"
                type="number"
                value={transactionToEdit.paid_amount}
                onChange={(e) =>
                  setTransactionToEdit({
                    ...transactionToEdit,
                    paid_amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Paid Amount"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium">
                Total Amount
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={transactionToEdit.amount}
                onChange={(e) =>
                  setTransactionToEdit({
                    ...transactionToEdit,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Total Amount"
              />
            </div>

            {/* Status (read-only) */}
            <div>
              <label className="block text-sm font-medium">Status</label>
              <span className="inline-block mt-1 px-2 py-1 rounded bg-gray-100 text-sm">
                {transactionToEdit.status}
              </span>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setTransactionToEdit(null);
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditTransaction}>Update</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
      </Dialog>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
