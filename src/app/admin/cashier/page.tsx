"use client";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
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
import StatusBadge from "@/components/ui/statusbadge";
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
  order_id?: number | null;
}

export default function Cashier() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextPayment, setNextPayment] = useState<number | "">("");
  const [nextPaymentError, setNextPaymentError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
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
    if (!newTransaction.description || newTransaction.description.trim() === "") {
      setFormError("Description is required.");
      return;
    }

    setFormError(null);
    
    try {
      setIsAdding(true);
      const payload = { ...newTransaction, status: computeStatus() };
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
    } finally {
      setIsAdding(false);
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

    const currentPaid = transactionToEdit.paid_amount;
    const total = transactionToEdit.amount;
    const left = total - currentPaid;
    const payment = typeof nextPayment === "number" ? nextPayment : 0;

    if (payment < 0) {
      setNextPaymentError("Payment cannot be less than 0.");
      return;
    }
    if (payment > left) {
      setNextPaymentError(`Payment cannot exceed Rs ${left.toFixed(2)}.`);
      return;
    }

    const newPaid = currentPaid + payment;
    const newstatus = (newPaid >= total) ? "paid" : newPaid <= 0 ? "unpaid" : "partial";
    
    setIsSaving(true);

    try {
      const response = await fetch(`/api/transactions/${transactionToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...transactionToEdit,
          paid_amount: newPaid,
          status: newstatus,
        }),
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
    } finally {
      setIsSaving(false);
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
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>New</TableCell>
                <TableCell>{formatDate(new Date().toISOString())}</TableCell>
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
                  <StatusBadge type="paymentStatus" value={computeStatus()} />
                </TableCell>
                <TableCell>
                  <LoadingButton
                    onClick={handleAddTransaction}
                    isLoading={isAdding}
                    loadingText="Adding..."
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add
                  </LoadingButton>
                </TableCell>
              </TableRow>

              {[...transactions]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      <StatusBadge type="transactionType" value={transaction.type} />
                    </TableCell>
                    <TableCell>Rs {transaction.paid_amount.toFixed(2)}</TableCell>
                    <TableCell>Rs {transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge type="paymentStatus" value={transaction.status} />
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
                            setNextPayment("");
                            setNextPaymentError(null);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <FilePenIcon className="w-5 h-5 text-gray-500 hover:text-blue-600 transition" />
                        </Button>

                        {/* Delete Button */}
                        {transaction.order_id === null && (
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
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
              ))}


            </TableBody>
          </Table>
          {formError && (
            <div className="mt-4 text-red-600 font-medium border border-red-400 bg-red-100 p-2 rounded">
              {formError}
            </div>
          )}
        </CardContent>
        {/* Remove card footer */}
      </Card>
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>

          {transactionToEdit && (
            <div className="space-y-4 text-m">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block mb-1">
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
                <label htmlFor="category" className="block mb-1">
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
                <label htmlFor="type" className="block mb-1">
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

              {/* Status & Amount Left */}
              
              <p>
                <strong>Payment Status: </strong>
                <span>
                  {transactionToEdit.status}
                </span>
              </p>
              
              <p>
                <strong>Amount Left:</strong>{" "}
                Rs {(transactionToEdit.amount - transactionToEdit.paid_amount).toFixed(2)}
              </p>

              {/* Next Payment (conditionally shown) */}
              {transactionToEdit.status !== "paid" && (
                <div>
                  <label htmlFor="next_payment" className="block mb-1">
                    Next Payment
                  </label>
                  <Input
                    id="next_payment"
                    type="number"
                    min={0}
                    step={0.01}
                    value={nextPayment}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNextPayment(val === "" ? "" : parseFloat(val));
                      setNextPaymentError(null);
                    }}
                    placeholder="Enter additional payment"
                  />
                  {nextPaymentError && (
                    <p className="text-sm text-red-600 mt-1">{nextPaymentError}</p>
                  )}
                </div>
              )}

              {/* Total Amount */}
              <div>
                <p>
                  <strong>Total Amount:</strong>{" "}
                  Rs {transactionToEdit.amount.toFixed(2)}
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransactionToEdit(null);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleEditTransaction}
                  isLoading={isSaving}
                  loadingText="Saving..."
                >
                  Save Changes
                </LoadingButton>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>


        <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
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
