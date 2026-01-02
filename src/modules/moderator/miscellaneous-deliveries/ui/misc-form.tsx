"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, SendHorizonal } from "lucide-react";
import { BottleInput } from "@/components/bottle-input";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";

const formSchema = z
  .object({
    isPaid: z.boolean(),
    customer_name: z.string().min(2).max(255),
    description: z.string().min(2),
    filled_bottles: z.number().min(0),
    empty_bottles: z.number().min(0),
    damaged_bottles: z.number().min(0),
    payment: z.number().min(0),
  })
  .refine((val) => val.damaged_bottles <= val.empty_bottles, {
    message: "Damaged bottles cannot be greater than empty bottles.",
    path: ["damaged_bottles"],
  })
  .refine((val) => !val.isPaid || val.payment > 0, {
    message: "Payment must be greater than 0 when marked Paid.",
    path: ["payment"],
  });

export const MiscDeliveryForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPaid: false,
      customer_name: "",
      description: "",
      filled_bottles: 0,
      empty_bottles: 0,
      damaged_bottles: 0,
      payment: 0,
    },
  });

  const moderator_id = useModeratorStore((state) => state.moderator?.id);
  const dob = useDOBStore((state) => state.dob);

  const queryClient = useQueryClient();
  const createMutation = useMutation(
    orpc.moderator.miscellaneous.addMiscDelivery.mutationOptions({
      onSuccess: async () => {
        toast.success("Miscellaneous delivery added successfully");
        if (!moderator_id || !dob) return;
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
              input: { id: moderator_id, date: dob },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: ["total_bottles"],
          }),
        ]);
      },
      onError: (error) => {
        toast.error(`Error adding miscellaneous delivery: ${error.message}`);
      },
    })
  );
  const submitting = createMutation.isPending;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!moderator_id) {
      toast.error("Moderator ID is not available. Please try again later.");
      return;
    }

    if (!dob) {
      toast.error("Please select a date of bottle usage.");
      return;
    }

    await createMutation.mutateAsync({
      moderator_id,
      ...values,
      delivery_date: dob,
    });

    form.reset();
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="isPaid"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Tabs
                    value={field.value ? "paid" : "foc"}
                    onValueChange={(val) => field.onChange(val === "paid")}
                  >
                    <FormLabel>Payment Type</FormLabel>
                    <TabsList className="w-full p-1 bg-gray-100">
                      <TabsTrigger
                        value="foc"
                        className="flex-1 data-[state=active]:bg-gray-300"
                      >
                        FOC
                      </TabsTrigger>
                      <TabsTrigger
                        value="paid"
                        className="flex-1 data-[state=active]:bg-gray-300"
                      >
                        Paid
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                  <Textarea placeholder="Add delivery details..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="filled_bottles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filled Bottles</FormLabel>
                  <FormControl>
                    <div className="*:not-first:mt-2">
                      <div className="relative">
                        <BottleInput
                          field={field}
                          onChange={field.onChange}
                          defaultValue={0}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="empty_bottles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empty Bottles</FormLabel>
                  <FormControl>
                    <div className="*:not-first:mt-2">
                      <div className="relative">
                        <BottleInput
                          field={field}
                          onChange={field.onChange}
                          defaultValue={0}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="damaged_bottles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Damaged Bottles</FormLabel>
                  <FormControl>
                    <div className="*:not-first:mt-2">
                      <div className="relative">
                        <BottleInput
                          field={field}
                          onChange={field.onChange}
                          defaultValue={0}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.watch("isPaid") && (
            <FormField
              control={form.control}
              name="payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
