"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { useModeratorStore } from "@/lib/ui-states/moderator-state";
import Image from "next/image";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { client } from "@/lib/orpc";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const ModHeader = () => {
  const pathname = usePathname();
  const moderator_name = useModeratorStore((state) => state.moderator?.name);

  const [LogoutConfirmDialog, logout_confirm] = useConfirm(
    "Are you sure you want to log out?",
    "You will be redirected to the login page."
  );

  const handleLogout = async () => {
    const ok = await logout_confirm();
    if (!ok) return;

    // Clear moderator state and cookies
    useModeratorStore.getState().setModerator(null);
    await client.moderator.auth.modLogout();
    redirect("/moderator/login");
  };

  return (
    <header className="w-full border-b border-gray-200 p-2 flex justify-between items-center">
      <LogoutConfirmDialog />
      <Link href={"/moderator"} className="text-lg font-semibold">
        <Image src={"/logo.jpg"} alt="Zainy Water" width={120} height={120} />
      </Link>
      <h1 className="capitalize flex flex-col items-center justify-center">
        Welcome, {moderator_name}{" "}
        <Badge variant={"outline"}>
          {format(new Date(), "do MMMM hh:mm:ss aaa")}
        </Badge>
      </h1>

      {!(pathname === "/moderator/login") && (
        <Button variant="outline" size={"sm"} onClick={handleLogout}>
          Logout
        </Button>
      )}
    </header>
  );
};
