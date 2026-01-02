"use client";

import { HighlightText } from "@/components/animate-ui/text/highlight";
import { DataTable5OtherExpense } from "./data-table-5-other-exp";
import { ChartAreaInteractive } from "@/modules/admin/components/chart-area-interactive";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import z from "zod";
import { OtherExpense30dRecords } from "@/modules/util/server/get30dOtherExpenses.orpc";

export const OtherExpenseMainSection = () => {
  const otherExpQuery = useQuery(orpc.util.get30dOtherExpenses.queryOptions());
  const otherExpData = otherExpQuery.data;

  let rawChartData: {
    date: string;
    targets: {
      label: string;
      value: number;
    }[];
  }[] = [];

  if (otherExpData) {
    rawChartData = transformData(otherExpData);
  }

  let totalExpenseAmount = 0;
  if (otherExpData) {
    otherExpData.map((data) => {
      totalExpenseAmount += data.OtherExpense.amount;
    });
  }

  return (
    <div className="min-h-screen w-full p-4 max-w-7xl">
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
              <span className={"text-2xl font-semibold"}>
                You have{" "}
                <HighlightText
                  className="font-semibold"
                  text={`${otherExpData?.length ?? "_"}`}
                />{" "}
                expenses totaling at Rs.{" "}
                <HighlightText
                  className="font-semibold"
                  text={`${totalExpenseAmount ?? "_"}`}
                />{" "}
                for last 30 days.
              </span>
            </div>
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive
                rawChartData={rawChartData}
                title={"Total Expenses"}
              />
            </div>
            <DataTable5OtherExpense data={otherExpData} />
          </div>
        </div>
      </div>
    </div>
  );
};

function transformData(data: z.infer<typeof OtherExpense30dRecords>[]) {
  const grouped: Record<string, Record<string, number>> = {};

  data.forEach((item) => {
    const date = item.OtherExpense.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
    const moderatorName = item.Moderator.name;

    if (!grouped[date]) grouped[date] = {};
    if (!grouped[date][moderatorName]) grouped[date][moderatorName] = 0;

    grouped[date][moderatorName]++;
  });

  return Object.entries(grouped).map(([date, moderators]) => ({
    date,
    targets: Object.entries(moderators).map(([label, value]) => ({
      label,
      value,
    })),
  }));
}
