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
import { toast } from "sonner";
import { redirect } from "next/navigation";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { client } from "@/lib/orpc";

const formSchema = z.object({
  name: z.string().min(2),
  password: z.string().min(4),
});

export const ModLoginForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  // 2. FORM submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);

    const { success, message, mod_data } = await client.moderator.auth.modLogin(
      { name: values.name, password: values.password }
    );

    setSubmitting(false);

    if (!success || !mod_data) {
      toast.error(message);
      return;
    }

    const { setModerator } = useModeratorStore.getState();

    setModerator({
      id: mod_data.id,
      name: mod_data.name,
      areas: mod_data.areas,
    });

    toast.success(message);
    redirect("/moderator");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
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
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="w-full flex justify-end">
          <Button type="submit" disabled={submitting}>
            Login
            {submitting && <Loader2 className="animate-spin" />}
          </Button>
        </div>
      </form>
    </Form>
  );
};
