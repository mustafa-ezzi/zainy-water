import { columnSchema } from "@/modules/admin/bottle-inventory/ui/data-table-2-bottle-inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GeneratedAvatar } from "@/lib/avatar";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  status: z.boolean(),
  revenue: z
    .number({
      message: "Revenue must be a valid number",
    })
    .min(0, { message: "Revenue cannot be negative" })
    .nonnegative({ message: "Revenue cannot be negative" }),
  expense: z
    .number({
      message: "Expense must be a valid number",
    })
    .min(0, { message: "Expense cannot be negative" })
    .nonnegative({ message: "Expense cannot be negative" }),
  filled: z
    .number({
      message: "Filled bottles must be a valid number",
    })
    .min(0, { message: "Filled bottles cannot be negative" })
    .nonnegative({ message: "Filled bottles cannot be negative" }),
  sales: z
    .number({
      message: "Sales must be a valid number",
    })
    .min(0, { message: "Sales cannot be negative" })
    .nonnegative({ message: "Sales cannot be negative" }),
  empty: z
    .number({
      message: "Empty bottles must be a valid number",
    })
    .min(0, { message: "Empty bottles cannot be negative" })
    .nonnegative({ message: "Empty bottles cannot be negative" }),
  remaining: z
    .number({
      message: "Remaining bottles must be a valid number",
    })
    .min(0, { message: "Remaining bottles cannot be negative" })
    .nonnegative({ message: "Remaining bottles cannot be negative" }),
  empty_returned: z
    .number({
      message: "Empty returned must be a valid number",
    })
    .min(0, { message: "Empty returned cannot be negative" })
    .nonnegative({ message: "Empty returned cannot be negative" }),
  remaining_returned: z
    .number({
      message: "Remaining returned must be a valid number",
    })
    .min(0, { message: "Remaining returned cannot be negative" })
    .nonnegative({ message: "Remaining returned cannot be negative" }),
  damaged: z
    .number({
      message: "Damaged bottles must be a valid number",
    })
    .min(0, { message: "Damaged bottles cannot be negative" })
    .nonnegative({ message: "Damaged bottles cannot be negative" }),
  refilled: z
    .number({
      message: "Refilled bottles must be a valid number",
    })
    .min(0, { message: "Refilled bottles cannot be negative" })
    .nonnegative({ message: "Refilled bottles cannot be negative" }),
  caps: z
    .number({
      message: "Caps must be a valid number",
    })
    .min(0, { message: "Caps cannot be negative" })
    .nonnegative({ message: "Caps cannot be negative" }),
});

export function BottleInventoryTableCellViewer({
  item,
}: {
  item: columnSchema;
}) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: item.bottleUsage.done,
      revenue: item.bottleUsage.revenue,
      expense: item.bottleUsage.expense,
      filled: item.bottleUsage.filled_bottles,
      sales: item.bottleUsage.sales,
      empty: item.bottleUsage.empty_bottles,
      remaining: item.bottleUsage.remaining_bottles,
      empty_returned: item.bottleUsage.empty_returned,
      remaining_returned: item.bottleUsage.remaining_returned,
      damaged: item.bottleUsage.damaged_bottles,
      refilled: item.bottleUsage.refilled_bottles,
      caps: item.bottleUsage.caps,
    },
  });

  const updateMutation = useMutation(
    orpc.admin.bottleInventory.editBottleUsage.mutationOptions({
      onSuccess: async () => {
        toast.success("Bottle usage updated successfully");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.util.getTotalBottles.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.util.get30dBottleUsage.queryKey(),
          }),
        ]);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to update bottle usage");
        console.error("Failed to update bottle usage:", error);
      },
    })
  );

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await updateMutation.mutateAsync({
      id: item.bottleUsage.id,
      status: data.status,
      revenue: data.revenue,
      expense: data.expense,
      filled: data.filled,
      sales: data.sales,
      empty: data.empty,
      remaining: data.remaining,
      empty_returned: data.empty_returned,
      remaining_returned: data.remaining_returned,
      damaged: data.damaged,
      refilled: data.refilled,
      caps: data.caps,
    });
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className={cn(
            "text-foreground w-fit px-0 text-left cursor-pointer capitalize",
            isMobile && "underline underline-offset-4 font-bold"
          )}
        >
          <GeneratedAvatar seed={item.moderator.name} />
          {item.moderator.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className={"flex items-center gap-2"}>
            <GeneratedAvatar seed={item.moderator.name} />
            {item.moderator.name}
          </DrawerTitle>
          <DrawerDescription>
            <div>Showing bottle usage for {item.moderator.name}</div>
<div>
  Date:{" "}
  {format(
    new Date(
      new Date(item.bottleUsage.createdAt).setDate(
        new Date(item.bottleUsage.createdAt).getDate() + 1
      )
    ),
    "PPP"
  )}
</div>
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Separator />
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-lg font-semibold">Bottle Usage Details</h2>
            </CardHeader>
            <CardContent className="p-0">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 p-4"
                >
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="cursor-pointer"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer">
                                Status (Done)
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="revenue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Revenue</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="expense"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expense</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="filled"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Filled Bottles</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="sales"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sales</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="empty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empty Bottles</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="remaining"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Remaining Bottles</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="empty_returned"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empty Returned</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="remaining_returned"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Remaining Returned</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="damaged"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Damaged Bottles</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="refilled"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Refilled Bottles</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="caps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Caps{" "}
                              <span className="text-gray-400">(taken)</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? Number(e.target.value) : 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
