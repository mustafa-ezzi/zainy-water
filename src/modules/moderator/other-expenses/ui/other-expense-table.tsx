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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OtherExpense } from "@/db/schema";
import { client } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

export const OtherExpenseTable = () => {
  const [expenses, setExpenses] = useState<
    (typeof OtherExpense.$inferSelect)[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { moderator } = useModeratorStore();

  const dob = useDOBStore((state) => state.dob);

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
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
