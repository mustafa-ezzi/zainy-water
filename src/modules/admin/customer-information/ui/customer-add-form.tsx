import { PhoneInputComponent } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Area, Customer } from "@/db/schema";
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
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().min(2),
  customer_id: z.string().min(2),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+\d{1,4}\d{10}$/,
      "Invalid phone number format. Use format: +92 333 6669999"
    ),
  address: z.string().min(2),
  area: z.enum(Area.enumValues),
  bottles: z.number().min(0),
  bottle_price: z.number().min(0),
  deposit: z.number().min(0),
  deposit_price: z.number().min(0),
  balance: z.number().min(0),
  advance: z.number().min(0),
  isActive: z.boolean(),
  customerSince: z.date({
    error: "A date of birth is required.",
  }),
});

export const CustomerAddForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      customer_id: "",
      phone: "",
      address: "",
      area: undefined,
      bottles: 0,
      bottle_price: 0,
      deposit: 0,
      deposit_price: 0,
      balance: 0,
      advance: 0,
      isActive: true,
      customerSince: new Date(),
    },
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    orpc.admin.customerInfo.createCustomer.mutationOptions({
      onSuccess: async () => {
        toast.success("Customer created successfully!");
        await queryClient.invalidateQueries({
          queryKey: orpc.admin.customerInfo.getAllCustomers.queryKey(),
        });
      },
      onError: (error) => {
        toast.error("Error creating customer: " + error.message);
        console.error(error);
      },
    })
  );
  const [open, setOpen] = useState(false);
  const [customerArea, setCustomerArea] = useState<
    (typeof Customer.$inferSelect)["area"] | null
  >("");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await createMutation.mutateAsync({
      data: {
        ...values,
        balance: values.balance - values.advance,
      },
    });
    form.reset();
    console.log("Customer create values:", values);
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-lg font-semibold">Customer Details</h2>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer ID</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <PhoneInputComponent field={field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Use format +92 333 6669999
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerSince"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full">
                      <FormLabel>Customer Since</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("2000-01-01")
                            }
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
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
                              {customerArea ? (
                                <div className="flex items-center justify-between w-full">
                                  <span>{customerArea}</span>
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
                                <CommandEmpty>No Area found.</CommandEmpty>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bottles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empty Bottles</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bottle_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Bottle (Rs)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Bottles</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit per Bottle (Rs)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance (Rs)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance (Rs)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="cursor-pointer"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {form.watch("isActive") ? "Active" : "Inactive"}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Check this if the customer is currently recieving
                        deliveries
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={"w-full flex justify-center items-start px-4"}>
                <Button
                  type={"submit"}
                  className={"min-w-[150px] cursor-pointer"}
                >
                  {createMutation.isPending ? (
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
  );
};
