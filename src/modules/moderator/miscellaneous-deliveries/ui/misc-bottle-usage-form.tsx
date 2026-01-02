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
import { AlertTriangle, Loader2, SendHorizonal } from "lucide-react";
import { BottleInput } from "@/components/bottle-input";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

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

  const moderator_id = useModeratorStore((state) => state.moderator?.id);

  const queryClient = useQueryClient();
  const addMiscRecordMutation = useMutation(
    orpc.moderator.miscellaneous.addMiscBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Miscellaneous bottle usage recorded successfully");
        form.reset();
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
              input: { id: moderator_id || "", date: new Date() },
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
    if (!moderator_id) {
      toast.error("Moderator session not found");
      return;
    }

    if (values.empty_bottles === 0 && values.damaged_bottles === 0) {
      toast.error("Please enter at least one bottle count");
      return;
    }

    await addMiscRecordMutation.mutateAsync({
      moderator_id,
      ...values,
    });
  }

  const isSubmitting = addMiscRecordMutation.isPending;

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
                      onChange={field.onChange}
                      defaultValue={0}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-muted-foreground">
                    Number of empty bottles collected through miscellaneous sources
                    (e.g., customers, events)
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
                      onChange={field.onChange}
                      defaultValue={0}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-muted-foreground">
                    Number of bottles that are damaged or unusable (write-off)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button - Red/orange to emphasize caution */}
          <Button
            type="submit"
            disabled={isSubmitting}
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
    </div>
  );
}