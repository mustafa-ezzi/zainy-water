import { redirect } from "next/navigation";
import { ModTabs } from "@/modules/moderator/components/mod-tabs";
import { client } from "@/lib/orpc.server";

const OtherExpensePage = async () => {
  const moderator = await client.moderator.auth.modMiddleware();

  if (!moderator.success) {
    redirect("/moderator/login");
  }

  return (
    <div className="flex flex-col md:items-center justify-start min-h-screen gap-y-10 md:mt-4 md:px-4">
      <ModTabs />
    </div>
  );
};

export default OtherExpensePage;
