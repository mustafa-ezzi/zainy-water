"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { toast } from "sonner";
import { Loader2, SendHorizonal } from "lucide-react";
import { otherExpenseDataSchema } from "@/modules/moderator/other-expenses/server/add-other-expense.orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

const formSchema = z.object({
  refilled_bottles: z.number().min(0),
  amount: z.number().min(1),
  description: z.string().min(1).max(250),
});

export function OtherExpenseForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      refilled_bottles: 0,
      amount: 0,
      description: "",
    },
  });

  const moderator = useModeratorStore((state) => state.moderator);

  const dob = useDOBStore((state) => state.dob);

  const queryClient = useQueryClient();
  const createOtherExpenseMutation = useMutation(
    orpc.moderator.otherExpenses.addOtherExpense.mutationOptions({
      onSuccess: async () => {
        if (!moderator || !dob) return;
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
              input: { id: moderator.id, date: dob },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.util.getTotalBottles.queryKey(),
          }),
        ]);
      },
    })
  );
  const submitting = createOtherExpenseMutation.isPending;

  // FORM submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!moderator) {
      toast.error("Moderator not found. Please log in.");
      return;
    }

    if (!dob) {
      toast.error("Date of Bottle Usage not set. Please select a date.");
      return;
    }

    const data: z.infer<typeof otherExpenseDataSchema> = {
      moderator_id: moderator.id,
      refilled_bottles: values.refilled_bottles,
      amount: values.amount,
      description: values.description,
      date: dob,
    };
    console.log(data);

    // Call the action to create the other expense
    const expense = await createOtherExpenseMutation.mutateAsync({ ...data });

    if (expense.success) {
      toast.success("Expense created successfully!");
      form.reset(); // Reset the form after successful submission
    } else {
      console.error("Failed to create expense");
      alert(`Failed to create expense. ${expense.error}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="refilled_bottles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refilled Bottles</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Refilled Bottles"
                  type="number"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Convert to number or null if empty
                    field.onChange(value ? parseFloat(value) : null);
                  }}
                />
              </FormControl>
              <FormDescription>
                This is the number of bottles refilled from other plant.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Amount"
                  type="number"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Convert to number or null if empty
                    field.onChange(value ? parseFloat(value) : null);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={submitting}
          type="submit"
          className="w-full bg-primary disabled:opacity-100 disabled:hover:cursor-not-allowed shadow-lg shadow-blue-300/40 hover:shadow-xl hover:shadow-blue-400/50 font-bold"
        >
          Submit
          {submitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </Button>
      </form>
    </Form>
  );
}
