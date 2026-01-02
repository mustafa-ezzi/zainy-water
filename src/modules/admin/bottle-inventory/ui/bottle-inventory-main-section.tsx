"use client";

import { BottleInventorySectionCards } from "@/modules/admin/bottle-inventory/ui/bottle-inventory-section-cards";
import { DataTable2BottleInventory } from "@/modules/admin/bottle-inventory/ui/data-table-2-bottle-inventory";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { orpc } from "@/lib/orpc";
import { ChartLineInteractive } from "@/modules/admin/components/line-chart-interactive";
import { BottleUsage30dDataSchema } from "@/modules/util/server/get30dBottleUsage.orpc";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownWideNarrow } from "lucide-react";
import { z } from "zod";
import { DataTable2_1ResettedBottleUsage } from "./data-table-2_1-resetted-bottle-usage";

export function BottleInventoryMainSection() {
  const totalBottlesQuery = useQuery(
    orpc.util.getTotalBottles.queryOptions({})
  );

  const bottleUsageQuery = useQuery(orpc.util.get30dBottleUsage.queryOptions());
  const bottleUsageData = bottleUsageQuery.data?.data;

  const totalBottles = totalBottlesQuery.data?.success
    ? totalBottlesQuery.data.totalBottles
    : undefined;

  // const revenueList = useQuery({
  //   queryKey: ["getSalesAndExpenses"],
  //   queryFn: async () => {
  //     if (bottleUsageData) {
  //       return await Promise.all(
  //         bottleUsageData?.map((item) => {
  //           return getSalesAndExpenses(
  //             item.moderator.id,
  //             item.bottleUsage.createdAt
  //           );
  //         })
  //       );
  //     }
  //   },
  // });
  // const revenueData = revenueList.data;

  const filteredInitialized = bottleUsageData?.filter(
    (item) => item.bottleUsage.filled_bottles > 0
  );
  const filteredUninitialized = bottleUsageData?.filter(
    (item) =>
      item.bottleUsage.filled_bottles === 0 &&
      item.bottleUsage.returned_bottles === 0 &&
      item.bottleUsage.expense === 0 &&
      item.bottleUsage.refilled_bottles === 0
  );
  let rawChartData: {
    date: string;
    targets: {
      label: string;
      value: number;
    }[];
  }[] = [];

  if (bottleUsageData) {
    rawChartData = transformData(bottleUsageData);
  }

  return (
    <div className="min-h-screen w-full p-4 max-w-7xl">
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <BottleInventorySectionCards total_bottles={totalBottles} />
            <div className="px-4 lg:px-6">
              {/*<ChartAreaInteractive*/}
              {/*  rawChartData={rawChartData}*/}
              {/*  title={"Total Bottle Usage"}*/}
              {/*/>*/}
              <ChartLineInteractive
                rawChartData={rawChartData}
                title={"Total Bottle Usage"}
              />
            </div>
            <DataTable2BottleInventory data={filteredInitialized} />
            <div className={"mt-4"}>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger className="cursor-pointer decoration-red-500">
                    <h1 className="text-xl font-semibold font-mono text-destructive mb-2 flex items-center gap-2">
                      <span>Reseted or Uninitialized</span>
                      <ArrowDownWideNarrow className="size-6" />
                    </h1>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DataTable2_1ResettedBottleUsage
                      data={filteredUninitialized}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function transformData(
  data: z.infer<typeof BottleUsage30dDataSchema>[]
) {
  const grouped: Record<string, { label: string; value: number }[]> = {};

  data.forEach((item) => {
    const date = item.bottleUsage.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({
      label: item.moderator.name,
      value: item.bottleUsage.filled_bottles,
    });
  });

  return Object.entries(grouped).map(([date, targets]) => ({
    date,
    targets,
  }));
}
