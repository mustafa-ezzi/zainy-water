import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { GeneratedAvatar } from "@/lib/avatar";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { columnSchema } from "./data-table-5-other-exp";

const formSchema = z.object({
  amount: z.number().min(1),
  description: z.string().min(2),
  refilled_bottles: z.number().min(0),
});

export const OtherExpTableCellViewer = ({ item }: { item: columnSchema }) => {
  const isMobile = useIsMobile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: item.OtherExpense.amount || 0,
      description: item.OtherExpense.description || "",
      refilled_bottles: item.OtherExpense.refilled_bottles || 0,
    },
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    orpc.admin.otherExpenses.updateOtherExpense.mutationOptions({
      onSuccess: async () => {
        toast.success("Expense updated successfully");
        await queryClient.invalidateQueries({
          queryKey: orpc.util.get30dOtherExpenses.queryKey(),
        });
      },
    })
  );

  const button_disabled =
    form.watch("amount") === item.OtherExpense.amount &&
    form.watch("description") === item.OtherExpense.description &&
    form.watch("refilled_bottles") === item.OtherExpense.refilled_bottles &&
    updateMutation.isPending;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await updateMutation.mutateAsync({
      data: {
        ...values,
      },
      moderator: item.Moderator,
      otherExpense: item.OtherExpense,
    });
    console.log(values);
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
          <GeneratedAvatar seed={item.Moderator.name} />
          {item.Moderator.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-2">
            <GeneratedAvatar seed={item.Moderator.name} /> {item.Moderator.name}
          </DrawerTitle>
          <DrawerDescription>
            <div>Showing details of expenses for {item.Moderator.name}</div>
            <div>Date: {format(item.OtherExpense.createdAt, "PPP")}</div>
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Separator />
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-lg font-semibold">Expense Details</h2>
            </CardHeader>
            <CardContent className="p-0">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <ul className="divide-y divide-border">
                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem
                            className={
                              "w-full flex flex-row items-center justify-between"
                            }
                          >
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type={"number"}
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Convert to number or 0 if empty
                                  field.onChange(value ? parseFloat(value) : 0);
                                }}
                                className={"max-w-[100px]"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>

                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem
                            className={
                              "w-full flex flex-row items-center justify-between"
                            }
                          >
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className={"max-w-[150px]"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>

                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="refilled_bottles"
                        render={({ field }) => (
                          <FormItem
                            className={
                              "w-full flex flex-row items-center justify-between"
                            }
                          >
                            <FormLabel>Refilled Bottles</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type={"number"}
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Convert to number or 0 if empty
                                  field.onChange(value ? parseFloat(value) : 0);
                                }}
                                className={"max-w-[100px]"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>
                  </ul>
                  <div
                    className={"w-full flex justify-center items-start px-4"}
                  >
                    <Button
                      type={"submit"}
                      className={"min-w-[150px] cursor-pointer"}
                      disabled={button_disabled}
                    >
                      {updateMutation.isPending ? (
                        <>
                          Saving
                          <Loader2 className={"animate-spin"} />
                        </>
                      ) : (
                        <>Save</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
