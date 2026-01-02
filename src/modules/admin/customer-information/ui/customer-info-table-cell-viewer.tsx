import { PhoneInputComponent } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Area, Customer } from "@/db/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { GeneratedAvatar } from "@/lib/avatar";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { columnSchema } from "./data-table-6-customer-info";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  name: z.string().min(2),
  customer_id: z.string().min(2),
  phone: z.string().min(2),
  address: z.string().min(2),
  area: z.enum(Area.enumValues),
  bottles: z.number().min(0),
  bottle_price: z.number().min(0),
  deposit: z.number().min(0),
  deposit_price: z.number().min(0),
  balance: z.number().min(0),
  advance: z.number().min(0),
  isActive: z.boolean(),
  customerSince: z.date(),
});

export const CustomerInfoTableCellViewer = ({
  item,
}: {
  item: columnSchema;
}) => {
  const isMobile = useIsMobile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.Customer.name,
      customer_id: item.Customer.customer_id,
      phone: item.Customer.phone,
      address: item.Customer.address,
      area: item.Customer.area,
      bottles: item.Customer.bottles,
      bottle_price: item.Customer.bottle_price,
      deposit: item.Customer.deposit,
      deposit_price: item.Customer.deposit_price,
      balance: item.Customer.balance > 0 ? item.Customer.balance : 0,
      advance: item.Customer.balance < 0 ? Math.abs(item.Customer.balance) : 0,
      isActive: item.Customer.isActive,
      customerSince: item.Customer.createdAt,
    },
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    orpc.admin.customerInfo.updateCustomer.mutationOptions({
      onSuccess: async () => {
        toast.success("Customer information updated successfully.");
        await queryClient.invalidateQueries({
          queryKey: orpc.admin.customerInfo.getAllCustomers.queryKey(),
        });
      },
      onError: (error) => {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Error updating customer."
        );
      },
    })
  );
  const [open, setOpen] = useState(false);
  const [customerArea, setCustomerArea] = useState<
    (typeof Customer.$inferSelect)["area"] | null
  >("");

  const button_disabled =
    form.watch("name") === item.Customer.name &&
    form.watch("customer_id") === item.Customer.customer_id &&
    form.watch("phone") === item.Customer.phone &&
    form.watch("address") === item.Customer.address &&
    form.watch("area") === item.Customer.area &&
    form.watch("bottles") === item.Customer.bottles &&
    form.watch("bottle_price") === item.Customer.bottle_price &&
    form.watch("deposit") === item.Customer.deposit &&
    form.watch("deposit_price") === item.Customer.deposit_price &&
    form.watch("balance") === item.Customer.balance &&
    form.watch("isActive") === item.Customer.isActive;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await updateMutation.mutateAsync({
      id: item.Customer.id,
      data: {
        ...values,
        balance: values.balance - values.advance,
        customerSince: values.customerSince,
      },
    });
    console.log("Customer update values:", values);
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="link"
          className={cn(
            "text-foreground w-fit px-0 text-left cursor-pointer",
            isMobile && "underline underline-offset-4 font-bold"
          )}
        >
          <GeneratedAvatar seed={item.Customer.name} />
          {item.Customer.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-2">
            <GeneratedAvatar seed={item.Customer.name} /> {item.Customer.name}
          </DrawerTitle>
          <DrawerDescription>
            <div>Showing details for {item.Customer.name}</div>
            <div>Customer Since: {format(item.Customer.createdAt, "PPP")}</div>
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Separator />
          <Card className="w-full">
            <CardHeader>
              <h2 className="text-lg font-semibold">Customer Details</h2>
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
                        name="name"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                className="max-w-[200px]"
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
                        name="customer_id"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Customer ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                className="max-w-[200px]"
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <div className="max-w-[200px]">
                                <PhoneInputComponent field={field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>

                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="customerSince"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between w-full">
                            <FormLabel>Customer Since</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[200px] pl-3 text-left font-normal",
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
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("2000-01-01")
                                  }
                                  captionLayout="dropdown"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>

                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="max-w-[200px]"
                                rows={2}
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
                        name="area"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Area</FormLabel>
                            <FormControl>
                              <div>
                                <Popover open={open} onOpenChange={setOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={open}
                                      className="w-full justify-between"
                                    >
                                      {customerArea || item.Customer.area ? (
                                        <div className="flex items-center justify-between w-full">
                                          <span>
                                            {customerArea || item.Customer.area}
                                          </span>
                                        </div>
                                      ) : (
                                        "Select Area"
                                      )}
                                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search Area..." />
                                      <CommandList>
                                        <CommandEmpty>
                                          No Area found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {Area.enumValues.map((area) => (
                                            <CommandItem
                                              key={area}
                                              value={area}
                                              onSelect={() => {
                                                field.onChange(area);
                                                setCustomerArea(area);
                                                setOpen(false);
                                              }}
                                            >
                                              <CheckIcon
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  area === customerArea
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              <span>{area}</span>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>

                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="bottles"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Bottles</FormLabel>
                            <FormControl>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <Input
                                    {...field}
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(
                                        value ? parseInt(value) : 0
                                      );
                                    }}
                                    className="max-w-[100px]"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="flex items-center">
                                    <TriangleAlert className="mr-1 size-4" />{" "}
                                    Use with caution!
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </li>

                    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <FormField
                        control={form.control}
                        name="bottle_price"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Bottle Price</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : 0);
                                }}
                                className="max-w-[100px]"
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
                        name="deposit"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Deposit</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : 0);
                                }}
                                className="max-w-[100px]"
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
                        name="deposit_price"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Deposit Price</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : 0);
                                }}
                                className="max-w-[100px]"
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
                        name="balance"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Balance</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : 0);
                                }}
                                className="max-w-[100px]"
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
                        name="advance"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>Advance</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? parseInt(value) : 0);
                                }}
                                className="max-w-[100px]"
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
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-row items-center justify-between">
                            <FormLabel>
                              {form.watch("isActive") ? "Active" : "Inactive"}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
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
                      className={"min-w-[150px]"}
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
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
