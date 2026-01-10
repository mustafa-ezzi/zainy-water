"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

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
import {
  CalendarIcon,
  CheckCheckIcon,
  Loader2,
  SendHorizonal,
  Trash,
  Undo2,
} from "lucide-react";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { toast } from "sonner";
import { BottleUsageTable } from "./bottle-usage-table";
import { BottleReturnForm } from "./bottle-return-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { TotalBottles } from "@/db/schema";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfDay, subDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/hooks/use-confirm";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";
import { useEffect } from "react";

const formSchema = z.object({
  dob: z.date(),
  filled_bottles: z.number().min(0),
  caps: z.number().min(0),
});

export const BottleUsageForm = () => {
  const { dob, setDOB } = useDOBStore();

  // Initialize DOB only once if not set
  useEffect(() => {
    if (!dob) {
      console.log(`Initializing DOB to ${new Date()}`);
      setDOB(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dob: dob || new Date(),
      filled_bottles: 0,
      caps: 0,
    },
  });

  // Sync form date changes to Zustand store
  const form_dob = form.watch("dob");
  useEffect(() => {
    // Only update if there's an actual change and form_dob is valid
    if (form_dob && dob && form_dob.getTime() !== dob.getTime()) {
      setDOB(form_dob);
      console.log(`Setting DOB to ${form_dob}`);
    }
  }, [form_dob, dob, setDOB]); // Now safe - uses getTime() comparison

  const moderator_id = useModeratorStore((state) => state.moderator?.id);

  const totalBottlesQuery = useQuery(
    orpc.util.getTotalBottles.queryOptions({})
  );
  const totalBottlesData = totalBottlesQuery?.data?.success
    ? totalBottlesQuery.data.totalBottles
    : ({} as typeof TotalBottles.$inferSelect);

  // Use dob from Zustand store instead of form.watch to prevent unnecessary re-renders
  const currentDob = dob;

  const bottleUsageQuery = useQuery({
    ...orpc.moderator.bottleUsage.getBottleUsage.queryOptions({
      input: { id: moderator_id || "", date: currentDob },
    }),
    enabled: !!moderator_id && !!currentDob, // Only run query when both values are valid
  });
  const bottleUsageData = bottleUsageQuery.data;

  const queryClient = useQueryClient();

  const bottleUsageMutation = useMutation(
    orpc.moderator.bottleUsage.addUpdateBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Bottle usage added successfully");
        await queryClient.invalidateQueries({
          queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
            input: { id: moderator_id || "", date: form.getValues("dob") },
          }),
        });
      },
      onError: (err) => {
        console.error("Failed to add bottle usage", { err });
        toast.error(`Failed to add bottle usage: ${err.message}`);
      },
    })
  );

  const submitting = bottleUsageMutation.isPending;

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!moderator_id) {
      toast.error("Moderator ID is not available");
      return;
    }

    if (!totalBottlesQuery.data) {
      return;
    }

    if (values.filled_bottles > totalBottlesData.available_bottles) {
      toast.error("Filled bottles cannot exceed available bottles");
      return;
    }

    const data = {
      moderator_id: moderator_id,
      dob: values.dob,
      filled_bottles: values.filled_bottles,
      caps: values.caps,
    };

    try {
      const response = await bottleUsageMutation.mutateAsync({ ...data });
      console.log({ response });
      // Reset only the filled_bottles and caps fields, keep the date
      form.reset({
        dob: form.getValues("dob"), // Keep the current date
        filled_bottles: 0,
        caps: 0,
      });
    } catch (error) {
      alert("Failed to update bottle usage");
      console.error({ error });
    }
  }

  const doneMutation = useMutation(
    orpc.moderator.bottleUsage.markAsDone.mutationOptions({
      onSuccess: async () => {
        toast.success("Marked successfully");
        await queryClient.invalidateQueries({
          queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
            input: { id: moderator_id || "", date: form.getValues("dob") },
          }),
        });
      },
      onError: (err) => {
        console.error("Failed to mark done", { err });
        toast.error(`Failed to update: ${err.message}`);
      },
    })
  );

  const handleMarkAsDone = async (done: boolean) => {
    if (!moderator_id) {
      toast.error("Moderator ID is not available");
      return;
    }

    await doneMutation.mutateAsync({ id: moderator_id, done, dob: currentDob });
  };

  const deleteMutation = useMutation(
    orpc.moderator.bottleUsage.deleteBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Deleted successfully");
        await queryClient.invalidateQueries({
          queryKey: orpc.moderator.bottleUsage.getBottleUsage.queryKey({
            input: { id: moderator_id || "", date: form.getValues("dob") },
          }),
        });
      },
      onError: (err) => {
        console.error("Failed to delete bottle usage", { err });
        toast.error(`Failed to delete: ${err.message}`);
      },
    })
  );

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure you want to delete this record?",
    "This action will also permanently remove associated delivery records.",
    true
  );

  const handleDeleteBottleUsage = async (dob: Date) => {
    const ok = await confirm();
    if (!ok) return;

    await deleteMutation.mutateAsync({ dob, moderator_id: moderator_id! });
  };

  return (
    <>
      <ConfirmDialog />
      <Badge
        variant={"outline"}
        className={cn(
          !dob && "text-muted-foreground",
          "flex justify-center items-center mt-2"
        )}
      >
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        {dob ? format(dob, "PPP") : <span>Pick a date</span>}
      </Badge>
      <div>
        <BottleUsageTable
          totalBottlesQuery={totalBottlesQuery}
          bottleUsageQuery={bottleUsageQuery}
        />

        <div className="w-full flex justify-center items-center gap-2">
          <h1 className="font-bold">Bottles Taken</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of bottle-usage</FormLabel>
                  <div className="flex justify-between items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "flex-1 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={
                            (date) => date > new Date()
                            // || date < new Date(subDays(new Date(), 30))
                          }
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      type="button"
                      size={"icon"}
                      variant={"outline"}
                      onClick={() =>
                        handleDeleteBottleUsage(form.getValues("dob"))
                      }
                    >
                      <Trash className="size-4 text-rose-500" />
                    </Button>

                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filled_bottles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filled Bottles</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="00"
                      type="number"
                      onChange={(e) => {
                        const value = e.target.value;
                        // Convert to number or null if empty
                        field.onChange(value ? parseFloat(value) : null);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Total bottles filled from main plant.
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
                  <FormLabel>Caps</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="00"
                      type="number"
                      onChange={(e) => {
                        const value = e.target.value;
                        // Convert to number or null if empty
                        field.onChange(value ? parseFloat(value) : null);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Total caps used from main plant.
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

        <div className="mt-10">
          <div>
            <h1 className="w-full text-center font-bold">Bottles Return</h1>
          </div>
          <BottleReturnForm />
        </div>

        <Separator className="my-6" />

        <div className={"grid md:grid-cols-2 grid-cols-1 gap-4"}>
          <div className={"w-fit mx-auto md:mx-0"}>
            <h1 className="w-full font-bold">Sales and Expenses</h1>
            <p
              className={"font-mono w-full items-center grid grid-cols-2 gap-4"}
            >
              <span>Revenue:</span>
              <span>
                {bottleUsageData ? (
                  `{ Rs. ${bottleUsageData.revenue} }`
                ) : (
                  <Loader2 className={"animate-spin"} />
                )}
              </span>
            </p>
            <p className={"font-mono items-center grid grid-cols-2 gap-4"}>
              <span>Expense:</span>
              <span>
                {bottleUsageData ? (
                  `{ Rs. ${bottleUsageData.expense} }`
                ) : (
                  <Loader2 className={"animate-spin"} />
                )}
              </span>
            </p>
          </div>
          <div className="w-full flex md:justify-end items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMarkAsDone(false)}
              className="text-gray-800 flex-1 md:w-fit"
            >
              <span>Revert done status</span>
              {doneMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Undo2 className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMarkAsDone(true)}
              className="flex-1 md:w-fit"
            >
              <span>Mark as done</span>
              {doneMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCheckIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
