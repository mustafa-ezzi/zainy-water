"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export const SidebarToggleButton = ({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { toggleSidebar, open, isMobile } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="outline"
      size="icon"
      className={cn("size-8 hover:bg-gray-200", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <div className="text-muted-foreground">
        {isMobile ? (
          <Menu className="size-6" />
        ) : open ? (
          <PanelLeftClose className="size-6" />
        ) : (
          <PanelLeftOpen className="size-6" />
        )}
      </div>
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};
