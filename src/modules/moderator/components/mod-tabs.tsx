"use client";

import {
  CalendarCheck,
  CalendarIcon,
  ChartPie,
  CircleDollarSign,
  Dice5,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDOBStore } from "@/lib/ui-states/date-of-bottle-usage";
import { cn } from "@/lib/utils";
import { DailyDeliveryForm } from "@/modules/moderator/daily-deliveries/ui/daily-delivery-form";
import { DailyDeliveryTable } from "@/modules/moderator/daily-deliveries/ui/daily-delivery-table";
import { MiscBottleUsageForm } from "@/modules/moderator/miscellaneous-deliveries/ui/misc-bottle-usage-form";
import { format } from "date-fns";
import { useEffect } from "react";
import { BottleUsageForm } from "../bottle-usage/ui/bottle-usage-form";
import { MiscDeliveryForm } from "../miscellaneous-deliveries/ui/misc-form";
import { MiscDeliveryTable } from "../miscellaneous-deliveries/ui/misc-table";
import { OtherExpenseForm } from "../other-expenses/ui/other-expense-form";
import { OtherExpenseTable } from "../other-expenses/ui/other-expense-table";
import { DobSelector } from "./dob-selector";

const mod_tabs = [
  {
    value: "daily_deliveries",
    label: "Deliveries",
    icon: (
      <ShoppingCart
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
  {
    value: "bottle_usage",
    label: "Bottle Usage",
    icon: (
      <ChartPie
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
  {
    value: "expenses",
    label: "Expenses",
    icon: (
      <CircleDollarSign
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
  {
    value: "miscellaneous",
    label: "Miscellaneous",
    icon: (
      <Dice5
        className="-ms-0.5 me-1.5 opacity-60"
        size={16}
        aria-hidden="true"
      />
    ),
  },
];

export function ModTabs() {
  const { dob, setDOB } = useDOBStore();

  // Initialize DOB only once if not set
  useEffect(() => {
    if (!dob) {
      console.log(`Initializing DOB to ${new Date()}`);
      setDOB(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  return (
    <main className="w-full">
      <Tabs defaultValue="daily_deliveries">
        <ScrollArea>
          <TabsList className="w-full flex bg-background mb-3 h-auto -space-x-px p-0 shadow-xs rtl:space-x-reverse">
            {mod_tabs.map((tab, index) => (
              <TabsTrigger
                key={index}
                value={tab.value}
                className={cn(
                  "data-[state=active]:bg-muted data-[state=active]:after:bg-primary relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e",
                  "flex-1 min-w-[150px]"
                )}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="daily_deliveries">
          <section className="min-h-screen w-full flex flex-col md:items-center md:justify-center my-4 gap-y-4 p-2">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="text-primary font-bold text-xl text-center flex flex-col items-center justify-center gap-2">
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <CalendarCheck />
                    Daily Delivery Entry
                  </div>
                  <DobSelector />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DailyDeliveryForm />
              </CardContent>
            </Card>

            <DailyDeliveryTable />
          </section>
        </TabsContent>
        <TabsContent value="expenses">
          <section className="w-full flex flex-col md:items-center md:justify-center gap-y-6 p-2">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="text-primary font-bold text-xl text-center flex flex-col items-center justify-center gap-2">
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <CircleDollarSign />
                    Other /Bottle Expenses
                  </div>
                  <DobSelector />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OtherExpenseForm />
              </CardContent>
            </Card>

            <OtherExpenseTable />
          </section>
        </TabsContent>
        <TabsContent value="bottle_usage">
          <section className="w-full flex flex-col md:items-center md:justify-center gap-y-6 p-2">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="text-primary font-bold text-xl text-center flex flex-col items-center justify-center gap-2">
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <ChartPie />
                    Bottle Usage
                  </div>
                  <DobSelector />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BottleUsageForm />
              </CardContent>
            </Card>
          </section>
        </TabsContent>
        <TabsContent value="miscellaneous">
          <section className="w-full flex flex-col md:items-center md:justify-center gap-y-6 p-2">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="text-primary font-bold text-xl text-center flex flex-col items-center justify-center gap-2">
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <Dice5 />
                    Miscellaneous Delivery
                  </div>
                  <DobSelector />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiscDeliveryForm />
              </CardContent>
              <Separator />
              <CardHeader className={"mt-4"}>
                <CardTitle className="flex flex-col items-center justify-center gap-2">
                  <h1
                    className={
                      "text-primary font-bold text-center flex items-center justify-center gap-2"
                    }
                  >
                    <Dice5 />
                    Miscellaneous Bottle Usage
                  </h1>
                  <p
                    className={
                      "text-xs md:text-sm text-muted-foreground opacity-50"
                    }
                  >
                    (use with caution!)
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiscBottleUsageForm />
              </CardContent>
            </Card>

            <MiscDeliveryTable />
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
