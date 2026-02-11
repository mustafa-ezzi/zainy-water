"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OtherExpense } from "@/db/schema";
import { client } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";
import { useConfirm } from "@/hooks/use-confirm";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const OtherExpenseTable = () => {
  const [expenses, setExpenses] = useState<
    (typeof OtherExpense.$inferSelect)[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { moderator } = useModeratorStore();
  const queryClient = useQueryClient();

  const dob = useDOBStore((state) => state.dob);

  const [DeleteConfirmDialog, delete_confirm] = useConfirm(
    "Delete Expense?",
    "Are you sure you want to delete this expense? This action cannot be undone.",
    true
  );

  const deleteMutation = useMutation({
    mutationFn: async (expense: typeof OtherExpense.$inferSelect) => {
      await client.moderator.otherExpenses.deleteOtherExpense({
        expenseId: expense.id,
        moderatorId: expense.moderator_id,
        expenseAmount: expense.amount,
        reffilledBottles: expense.refilled_bottles,
        expenseDate: expense.date,
      });
    },
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      fetchExpenses();
    },
    onError: (error) => {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense. Please try again.");
    },
  });

  const handleDeleteClick = async (expense: typeof OtherExpense.$inferSelect) => {
    const confirmed = await delete_confirm();
    if (confirmed) {
      deleteMutation.mutate(expense);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);

    if (!moderator?.id) {
      toast.error("Moderator id missing. Please try again.");
      setLoading(false);
      return;
    }

    if (!dob) {
      toast.error("Date of bottle usage missing. Please select a date.");
      setLoading(false);
      return;
    }

    const expenseData =
      await client.moderator.otherExpenses.getOtherExpensesByModeratorId({
        id: moderator.id,
        dob: dob,
      });

    setLoading(false);

    if (expenseData) {
      setExpenses(expenseData);
    } else {
      console.error("Failed to fetch expenses");
      toast.error("Failed to fetch expenses. Please try again.");
    }
  };

  return (
    <div>
      <DeleteConfirmDialog />
      <div className="w-full flex justify-end mb-4">
        <Button variant={"outline"} onClick={fetchExpenses}>
          {expenses.length > 0 ? "Refresh" : "Show"} List
          {loading && <Loader2 className="animate-spin" />}
        </Button>
      </div>
      <div className="bg-background overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-9 py-2 min-w-[150px]">Date</TableHead>
              <TableHead className="h-9 py-2 min-w-[100px]">Amount</TableHead>
              <TableHead className="h-9 py-2 min-w-[150px]">
                Description
              </TableHead>
              <TableHead className="h-9 py-2 min-w-[80px] text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin size-6" />
                    </div>
                  ) : (
                    "No results"
                  )}
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="py-2 font-medium">
                  {format(expense.date, "PPP")}
                </TableCell>
                <TableCell className="py-2">{expense.amount}</TableCell>
                <TableCell className="py-2">{expense.description}</TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(expense)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        List of other expenses added today.
      </p>
    </div>
  );
};
