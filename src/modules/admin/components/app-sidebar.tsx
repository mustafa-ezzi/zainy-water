"use client";
import {
  AtSign,
  Home,
  Inbox,
  PlusCircle,
  Search,
  ShoppingCart,
  Sparkle,
  User,
} from "lucide-react";

import { ShinyButton } from "@/components/magicui/shiny-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MainFooter } from "@/components/main-footer";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Bottle Inventory",
    url: "/admin/bottle-inventory",
    icon: Inbox,
  },
  {
    title: "Deliveries",
    url: "/admin/deliveries",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    url: "/admin/customer-information",
    icon: User,
  },
  {
    title: "Expenses",
    url: "/admin/other-expenses",
    icon: Search,
  },
  {
    title: "Connect Whatsapp",
    url: "/admin/whatsapp",
    icon: Search,
  },
];

const admin_features = [
  {
    title: "Moderators",
    url: "/admin/add-moderator",
    icon: PlusCircle,
  },
];

type Props = {
  className?: string;
};

export function AppSidebar({ className }: Props) {
  const pathname = usePathname();

  return (
    <Sidebar className={cn("flex-1", className)}>
      <SidebarContent>
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className="flex items-center justify-center space-x-2 my-8">
            {/* <h1 className="text-2xl">Zainy Water</h1> */}
            <Link href={"/admin"}>
              <Image
                src={"/logo.jpg"}
                alt="Zainy Water"
                width={150}
                height={150}
                className="dark:bg-black rounded-md"
              />
            </Link>
          </SidebarGroupLabel>
          <Separator />
          <SidebarGroupContent>
            <SidebarMenu>
              <div>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        pathname === item.url &&
                          "bg-gray-300 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-900"
                      )}
                    >
                      <Link href={item.url} className="text-lg">
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <Separator />

                {admin_features.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        pathname === item.url &&
                          "bg-gray-300 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-900"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <div className="w-full mt-2">
                  <Link href="/admin/chat-bot">
                    <ShinyButton className="py-1 px-2 w-full">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <Sparkle className="size-4" />
                          <span className="">GEKKO</span>
                        </div>
                        <Badge variant={"outline"} className="text-[10px]">
                          new
                        </Badge>
                      </div>
                    </ShinyButton>
                  </Link>
                </div>

                <div className="fixed bottom-0 space-y-2">
                  {/* <Link href="/admin/changelog">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 underline">
                      <AtSign className="size-3" /> Changelog
                    </p>
                  </Link> */}
                  <MainFooter className="text-xs text-center text-muted-foreground w-full p-2" />
                </div>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
