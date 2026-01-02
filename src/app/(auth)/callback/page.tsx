import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { CallbackForm } from "./callback-form";
import { client } from "@/lib/orpc.server";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default async function LicenseApproval() {
  const response = await client.auth.adminMiddleware();
  console.log(response);

  const license_key = (await cookies()).get("license_key")?.value;
  console.log("License Key: ", license_key);

  const user = await currentUser();

  if (response.status === 401 || response.status === 500) {
    console.log("Error logging in: redirecting to sign-in");
    redirect("/sign-in");
  } else if (
    response.status === 202 &&
    license_key &&
    user &&
    license_key === user.id
  ) {
    redirect("/admin");
  }

  return (
    <div
      className={
        "min-h-screen w-full flex flex-col gap-2 justify-center items-center"
      }
    >
      <UserButton />
      <CallbackForm />
    </div>
  );
}
