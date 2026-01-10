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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { ArrowUpFromDot, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { dev_emails } from "@/lib/utils";
import { client, orpc } from "@/lib/orpc";

const formSchema = z.object({
  license_key: z.string().min(2, {
    message: "License key must be at least 2 characters.",
  }),
});

export function CallbackForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_key: "",
    },
  });

  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);


  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setCheckingUser(false);
      return;
    }

    const checkUser = async () => {
      try {
        const res = await client.auth.checkUserExists({ email });

        if (res.exists) {
          router.replace("/password"); // existing user
        }
      } catch (err) {
        console.error("User check failed:", err);
      } finally {
        setCheckingUser(false);
      }
    };

    checkUser();
  }, [isLoaded, isSignedIn, user, router]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    try {
      const licenseResponse = await client.auth.checkLicenseKey({
        licenseKey: values.license_key,
      });
      if (licenseResponse.success) {
        console.log(licenseResponse.message);
        toast.success("Request successful. Please wait...");
        router.push("/admin");
      } else {
        toast.error("An Error Occurred");
        console.log(licenseResponse.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to validate license key. Try Again.");
    } finally {
      setSubmitting(false);
    }
  }

  const licenseMutation = useMutation(
    orpc.auth.requestLicense.mutationOptions({
      onSuccess: (res) => {
        toast.success(res.message);
        if (res.redirect) {
          router.push("/admin");
        }
        setRequested(true);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to request license.");
        console.error("Failed to request license:", error);
      },
    }),
  );


  if (!isLoaded || checkingUser) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin size-6" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    toast.error("You are currently not signed-in.");


    return null;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Enter developer license key</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="license_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Key</FormLabel>
                  <FormControl>
                    <Input placeholder="******" {...field} />
                  </FormControl>
                  <FormDescription>
                    Retrieve your developer license key by contacting the
                    developer of this website.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={"outline"}
                className="cursor-pointer flex-1"
                onClick={() => licenseMutation.mutate()}
                disabled={requested}
              >
                {licenseMutation.isPending ? (
                  <>
                    Requesting <Loader2 className="animate-spin size-4" />
                  </>
                ) : requested ? (
                  "Requested"
                ) : (
                  "Request License"
                )}
              </Button>

              <Button type="submit" className="cursor-pointer flex-1">
                {submitting ? (
                  <>
                    Submitting <Loader2 className="animate-spin size-4" />
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground text-sm">
          {requested ? (
            <span>
              License request sent. Please contact the developer at{" "}
              <strong>{dev_emails[0]}</strong>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ArrowUpFromDot className="size-4" /> Request a license key first.
            </span>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}