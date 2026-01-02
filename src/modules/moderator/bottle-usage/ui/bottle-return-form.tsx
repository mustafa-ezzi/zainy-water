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
import { Loader2, SendHorizonal } from "lucide-react";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

const formSchema = z.object({
  empty_bottles: z.number().min(0),
  remaining_bottles: z.number().min(0),
  caps: z.number().min(0),
});

export const BottleReturnForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empty_bottles: 0,
      remaining_bottles: 0,
      caps: 0,
    },
  });

  const moderator_id = useModeratorStore((state) => state.moderator?.id);
  const dob = useDOBStore((state) => state.dob);

  const queryClient = useQueryClient();
  const bottleReturnMutation = useMutation(
    orpc.moderator.bottleUsage.returnBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Bottles return successful");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.util.getTotalBottles.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
              input: { id: moderator_id!, date: dob },
            }),
          }),
        ]);
      },
      onError: (error) => {
        toast.error(`Bottles return failed: ${error}`);
        alert(`Bottles return failed: ${error}`);
        console.error("Error details:", { error });
      },
    })
  );
  const submitting = bottleReturnMutation.isPending;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!moderator_id) {
      toast.error("Moderator ID is not available");
      return;
    }

    await bottleReturnMutation.mutateAsync({
      ...values,
      moderator_id,
      dob,
    });

    form.reset();
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="empty_bottles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empty Bottles</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="00"
                    type="number"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Convert to number or 0 if empty
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  This is the number of empty bottles you are returning.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remaining_bottles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remaining Bottles</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="00"
                    type="number"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Convert to number or 0 if empty
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  This is the number of filled bottles you are returning.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="caps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remaining Caps</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="00"
                    type="number"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Convert to number or 0 if empty
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  This is the number of remaining caps you are returning.
                </FormDescription>
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
    </div>
  );
};
