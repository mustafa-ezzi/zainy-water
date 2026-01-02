"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { LoadingDotsPulse } from "@/components/loading-dots";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Area } from "@/db/schema";
import { orpc } from "@/lib/orpc";
import { useAddModDrawer } from "@/lib/ui-states/add-moderator-drawer";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Moderator } from "./columns";

const formSchema = z
  .object({
    name: z.string().min(2),
    password: z.string().min(4),
    areas: z.array(z.enum(Area.enumValues)).min(1),
    isWorking: z.boolean(),
  })
  .refine(
    (data) => {
      const validAreas = data.areas.filter((area) => area !== undefined);
      return validAreas.length >= 1;
    },
    {
      message: "At least one area is required",
      path: ["areas"],
    }
  );

type Props = {
  mod_data: Moderator | null;
};

export function EditForm({ mod_data }: Props) {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: mod_data?.name || "",
      password: mod_data?.password || "",
      areas:
        mod_data?.areas && mod_data.areas.length > 0
          ? mod_data.areas
          : [undefined], // Keep one undefined slot for new entries
      isWorking: mod_data?.isWorking ?? true,
    },
  });

  const { closeDrawer } = useAddModDrawer();

  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    orpc.admin.crudModerator.updateModerator.mutationOptions({
      onSuccess: async () => {
        toast.success("Moderator updated successfully!");
        await queryClient.invalidateQueries({
          queryKey: orpc.admin.crudModerator.getModList.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to update moderator: ${error.message}`);
        console.error({ error });
      },
    })
  );
  const createMutation = useMutation(
    orpc.admin.crudModerator.createModerator.mutationOptions({
      onSuccess: async () => {
        toast.success("Moderator created successfully!");
        await queryClient.invalidateQueries({
          queryKey: orpc.admin.crudModerator.getModList.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Failed to create moderator: ${error.message}`);
        console.error({ error });
      },
    })
  );
  const isSubmitting = updateMutation.isPending || createMutation.isPending;
  const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Filter out empty areas
    const filteredAreas = values.areas.filter(
      (area): area is (typeof Area.enumValues)[number] => area !== undefined
    );
    const submissionData = {
      ...values,
      areas: filteredAreas,
    };

    if (mod_data?.name) {
      const updatedModerator = await updateMutation.mutateAsync({
        name: mod_data.name,
        data: submissionData,
      });
      console.log(updatedModerator);
    } else {
      const newModerator = await createMutation.mutateAsync({
        ...submissionData,
      });
      console.log(newModerator);
    }

    closeDrawer();
  }

  return (
    <div className="container mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="areas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Areas</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {field.value.map((area, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {/* <Select
                            value={area || ""}
                            onValueChange={(value) => {
                              const newAreas = [...field.value];
                              newAreas[index] =
                                value as (typeof Area.enumValues)[number];
                              field.onChange(newAreas);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={`Area ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {Area.enumValues.map((areaOption) => (
                                <SelectItem key={areaOption} value={areaOption}>
                                  {areaOption}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select> */}
                          <Popover
                            open={openStates[index] || false}
                            onOpenChange={(isOpen) =>
                              setOpenStates((prev) => ({
                                ...prev,
                                [index]: isOpen,
                              }))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openStates[index] || false}
                                className="w-full justify-between"
                              >
                                {area ? (
                                  <div className="flex items-center justify-between w-full">
                                    <span>{area}</span>
                                  </div>
                                ) : (
                                  `Select Area ${index + 1}`
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
                                    {Area.enumValues.map((areaOption) => (
                                      <CommandItem
                                        key={areaOption}
                                        value={areaOption}
                                        onSelect={(selectedValue) => {
                                          // The Command component sometimes lowercases values, so we need to find the original
                                          const actualArea =
                                            Area.enumValues.find(
                                              (area) =>
                                                area.toLowerCase() ===
                                                selectedValue.toLowerCase()
                                            ) || areaOption;

                                          const newAreas = [...field.value];
                                          newAreas[index] =
                                            actualArea as (typeof Area.enumValues)[number];
                                          field.onChange(newAreas);

                                          console.log(
                                            "Selected:",
                                            selectedValue,
                                            "Actual:",
                                            actualArea,
                                            "New areas:",
                                            newAreas
                                          );

                                          setOpenStates((prev) => ({
                                            ...prev,
                                            [index]: false,
                                          }));
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            areaOption === field.value[index]
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <span>{areaOption}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {field.value.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newAreas = field.value.filter(
                                  (_, i) => i !== index
                                );
                                field.onChange(newAreas);
                              }}
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newAreas = [...field.value, undefined];
                        field.onChange(newAreas);
                      }}
                      className="w-fit text-muted-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Area
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isWorking"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="cursor-pointer"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">Is Working</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Check this if the moderator is currently working
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="w-full flex flex-row justify-around items-center gap-x-10">
            <Button
              type="submit"
              className="w-1/2 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  {mod_data ? "Updating " : "Creating "}
                  <LoadingDotsPulse size="sm" />
                </>
              ) : (
                <>{mod_data ? "Update" : "Create"}</>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-1/2 cursor-pointer"
              type="button"
              onClick={closeDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
