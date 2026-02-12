"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

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
import { AlertTriangle, Loader2, SendHorizonal } from "lucide-react";
import { BottleInput } from "@/components/bottle-input";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";
import { BottleUsage } from "@/db/schema";

const formSchema = z.object({
  empty_bottles: z.number().min(0, "Cannot be negative"),
  damaged_bottles: z.number().min(0, "Cannot be negative"),
});

export function MiscBottleUsageForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empty_bottles: 0,
      damaged_bottles: 0,
    },
  });

  const moderator = useModeratorStore((state) => state.moderator);
  const dob = useDOBStore((state) => state.dob);
  const [bottleUsageData, setBottleUsageData] = useState<typeof BottleUsage.$inferSelect | null>(null);

  // Fetch bottle usage for today
  const { data: bottleUsage, isLoading: isLoadingBottleUsage } = useQuery(
    orpc.moderator.bottleUsage.getBottleUsage.queryOptions({
      input: {
        id: moderator?.id || "",
        date: dob,
      },
    })
  );

  useEffect(() => {
    if (bottleUsage) {
      setBottleUsageData(bottleUsage);
    }
  }, [bottleUsage]);

  const queryClient = useQueryClient();
  const addMiscRecordMutation = useMutation(
    orpc.moderator.miscellaneous.addMiscBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Miscellaneous bottle usage recorded successfully");
        form.reset();
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
              input: { id: moderator?.id || "", date: dob },
            }),
          }),
          queryClient.invalidateQueries({ queryKey: ["total_bottles"] }),
        ]);
      },
      onError: (error) => {
        console.error("Error adding misc bottle usage", error);
        toast.error("Failed to record miscellaneous bottle usage");
      },
    })
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!moderator?.id) {
      toast.error("Moderator session not found");
      return;
    }

    if (values.empty_bottles === 0 && values.damaged_bottles === 0) {
      toast.error("Please enter at least one bottle count");
      return;
    }

    await addMiscRecordMutation.mutateAsync({
      moderator_id: moderator.id,
      date: dob || new Date(),
      ...values,
    });
  }

  const isSubmitting = addMiscRecordMutation.isPending;
  const availableEmpty = bottleUsageData?.empty_bottles ?? 0;
  const availableDamaged = (bottleUsageData?.empty_bottles ?? 0) + (bottleUsageData?.remaining_bottles ?? 0);

  return (
    <div className="space-y-6">
      {/* Warning Alert - Matches screenshot exactly */}
      <div className="rounded-lg border border-orange-300/70 bg-orange-50/90 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-orange-900">Irreversible Action</p>
            <p className="text-orange-800">
              Recording miscellaneous empty or damaged bottles{" "}
              <strong>cannot be undone or edited</strong> later.
            </p>
            <p className="text-orange-800">
              Please double-check your entries before submitting.
            </p>
          </div>
        </div>
      </div>

      {isLoadingBottleUsage ? (
        <div className="rounded-lg border border-blue-300/70 bg-blue-50/90 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Loading available bottle limits...</p>
          </div>
        </div>
      ) : !bottleUsageData ? (
        <div className="rounded-lg border border-red-300/70 bg-red-50/90 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">
              No bottle usage record found for today. Please add a bottle usage record first.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Available Empty Bottles:</span> {availableEmpty}
            </p>
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Available Capacity for Damaged:</span> {availableDamaged}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
              {/* Two columns on larger screens, single column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="empty_bottles"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">
                        Empty Bottles Received
                      </FormLabel>
                      <FormControl>
                        <BottleInput
                          field={field}
                          onChange={(e) => {
                            const value = typeof e === "number" ? e : (e as any).target?.value ? parseInt((e as any).target.value || "0") : 0;
                            if (value > availableEmpty) {
                              form.setError("empty_bottles", {
                                message: `Cannot exceed available empty bottles (${availableEmpty})`,
                              });
                            } else {
                              form.clearErrors("empty_bottles");
                            }
                            field.onChange(value);
                          }}
                          defaultValue={0}
                          disabled={isSubmitting || !bottleUsageData}
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-muted-foreground">
                        Number of empty bottles collected{" "}
                        <span className="text-orange-600 font-semibold">
                          (Max: {availableEmpty})
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="damaged_bottles"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-base font-medium">
                        Damaged Bottles
                      </FormLabel>
                      <FormControl>
                        <BottleInput
                          field={field}
                          onChange={(e) => {
                            const value = typeof e === "number" ? e : (e as any).target?.value ? parseInt((e as any).target.value || "0") : 0;
                            if (value > availableDamaged) {
                              form.setError("damaged_bottles", {
                                message: `Cannot exceed available capacity (${availableDamaged})`,
                              });
                            } else {
                              form.clearErrors("damaged_bottles");
                            }
                            field.onChange(value);
                          }}
                          defaultValue={0}
                          disabled={isSubmitting || !bottleUsageData}
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-muted-foreground">
                        Number of bottles that are damaged or unusable{" "}
                        <span className="text-orange-600 font-semibold">
                          (Max: {availableDamaged})
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button - Red/orange to emphasize caution */}
              <Button
                type="submit"
                disabled={isSubmitting || !bottleUsageData}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed font-bold text-base py-6 shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 size-5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="mr-3 size-5" />
                    Permanently Record Usage
                  </>
                )}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}