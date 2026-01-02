"use client";

import { SidebarToggleButton } from "./sidebar-toggle-button";
import { UserButton } from "@clerk/nextjs";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export const AdminHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    if (isSpinning) return; // Prevent multiple clicks during animation

    setIsSpinning(true);
    router.push(pathname);

    // Reset animation after 600 ms (duration of the animation)
    setTimeout(() => setIsSpinning(false), 600);
  };

  return (
    <header className="w-full border-b border-border p-2 flex justify-between items-center">
      <div className={"flex items-center gap-2"}>
        <SidebarToggleButton />
        <Button variant={"outline"} size={"sm"} onClick={handleRefresh}>
          <RefreshCw
            className={`size-4 text-muted-foreground transition-transform duration-600 ease-in-out ${
              isSpinning ? "animate-spin-once" : ""
            }`}
          />
        </Button>
      </div>
      <h1 className="text-lg font-semibold font-mono">Admin Dashboard</h1>
      <div>
        <div className={"flex items-center gap-2 mr-2"}>
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
      <style jsx>{`
        @keyframes spin-once {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        :global(.animate-spin-once) {
          animation: spin-once 0.6s ease-in-out;
        }
      `}</style>
    </header>
  );
};
