import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminHeader } from "@/modules/admin/components/admin-header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Admin } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";

// Force dynamic rendering for this layout
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    process.env.NODE_ENV === "production"
      ? "Admin - Zainy Water"
      : "(Dev) Admin - Zainy Water",
  description: "Admin layout for Zainy Water",
};

type Props = { children: React.ReactNode };

const DashboardLayout = async ({ children }: Props) => {
  try {
    const user = await currentUser();
    if (!user) {
      return <></>;
    }

    await checkAuthorizationState(user.id);

    const license_key = (await cookies()).get("license_key");
    if (!license_key || license_key.value !== user.id) {
      redirect("/callback");
    }
    console.log(license_key);
  } catch (error) {
    console.error("Authentication error:", error);
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <main className="w-full min-h-screen flex justify-between">
        <AppSidebar />
        <div className="w-full flex-1 flex flex-col gap-2">
          <AdminHeader />
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};
export default DashboardLayout;

async function checkAuthorizationState(clerk_id: string) {
  "use server";
  const [admin] = await db
    .select()
    .from(Admin)
    .where(eq(Admin.clerk_id, clerk_id));

  if (!admin || !admin.isAuthorized) {
    redirect("/callback");
  }
}
