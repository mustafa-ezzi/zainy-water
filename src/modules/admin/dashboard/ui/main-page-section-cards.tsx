import { SlidingNumber } from "@/components/animate-ui/text/sliding-number";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BookCheck,
  ChartSpline,
  CircleDollarSign,
  Milk,
  ShieldCheck,
  SquareArrowOutUpRight,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { DashboardAnalyticsSchema } from "@/modules/admin/dashboard/server/dashboardAnalytics.orpc";

type Props = {
  data: z.infer<typeof DashboardAnalyticsSchema>;
};

export function MainSectionCards({ data }: Props) {
  const card_content = [
    {
      id: "total_revenue",
      title: "Total Revenue (PKR)",
      value: data.totalRevenue,
      href: "/admin/deliveries",
      description: "Revenue for the last 30 days",
      footer: "Account for this month",
      icon: <ChartSpline className="size-4" />,
    },
    {
      id: "expenses",
      title: "Expenses (PKR)",
      value: data.expenses,
      href: "/admin/other-expenses",
      description: "Expenses for the last 30 days",
      footer: "Account for this month",
      icon: <CircleDollarSign className="size-4" />,
    },
    {
      id: "cash_in_hand",
      title: "Cash in Hand (PKR)",
      value: data.cashInHand,
      href: "/admin/deliveries",
      description: "Revenue minus expenses",
      footer: "Account for this month",
      icon: <CircleDollarSign className="size-4" />,
    },
    {
      id: "customers",
      title: "Active Customers",
      value: data.customerCount,
      href: "/admin/customer-information",
      description: "Total customers receiving deliveries",
      footer: "All time record",
      icon: <UserCheck className="size-5" />,
    },
    {
      id: "moderators",
      title: "Moderators",
      value: data.moderatorCount,
      href: "/admin/add-moderator",
      description: "Total moderators working",
      footer: "All time record",
      icon: <ShieldCheck className="size-4" />,
    },
    {
      id: "total_bottles",
      title: "Total Bottles",
      value: data.totalBottles,
      href: "/admin/bottle-inventory",
      description: "Total Bottles in inventory",
      footer: "Updated regularly",
      icon: <Milk className="size-4" />,
    },
    {
      id: "deposit",
      title: "Deposit Bottles",
      value: data.depositBottles,
      href: "/admin/customer-information",
      description: "Total bottles given as deposit",
      footer: "All time record",
      icon: <BookCheck className="size-4" />,
    },
    {
      id: "available_bottles",
      title: "Available Bottles",
      value: data.availableBottles,
      href: "/admin/bottle-inventory",
      description: "Bottles available in inventory",
      footer: "Updated regularly",
      icon: <Milk className="size-4" />,
    },
    {
      id: "used_bottles",
      title: "Used Bottles",
      value: data.usedBottles,
      href: "/admin/deliveries",
      description: "Bottles in circulation",
      footer: "Updated regularly",
      icon: <Milk className="size-4" />,
    },
    {
      id: "damaged_bottles",
      title: "Damaged Bottles",
      value: data.damagedBottles,
      href: "/admin/bottle-inventory",
      description: "Bottles damaged in inventory",
      footer: "Updated regularly",
      icon: <Milk className="size-4" />,
    },
  ];
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 mb-6">
      {card_content.map((card) => (
        <Card
          className={cn(
            "@container/card",
            card.id === "total_revenue" &&
            (card.value < 0 ? "border-red-600/50" : "border-green-600/50"),
            card.id === "expenses" && "border-yellow-600/50",
            card.id === "cash_in_hand" &&
            (card.value < 0 ? "border-red-600/50" : "border-green-600/50")
          )}
          key={card.id}
        >
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
              {(card.id === "total_revenue" || card.id === "cash_in_hand") ? (
                <SlidingNumber
                  number={card.value}
                  className={cn(
                    card.value < 0 ? "text-red-500" : "text-emerald-500"
                  )}
                />
              ) : (
                <SlidingNumber number={card.value} />
              )}
            </CardTitle>
            <CardAction>
              <Link href={card.href}>
                <Badge
                  variant="outline"
                  className={
                    "text-muted-foreground hover:text-black transition-all"
                  }
                >
                  <SquareArrowOutUpRight className={"size-3"} />
                  Details
                </Badge>
              </Link>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 justify-start font-medium">
              {card.description} {card.icon}
            </div>
            <div className="text-muted-foreground">{card.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
