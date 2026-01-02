"use client";

import { HighlightText } from "@/components/animate-ui/text/highlight";
import { ChartAreaInteractive } from "@/modules/admin/components/chart-area-interactive";
import { DataTable3DailyDeliveries } from "@/modules/admin/deliveries/ui/data-table-3-daily-deliveries";
import { DataTable4MiscDeliveries } from "@/modules/admin/deliveries/ui/data-table-4-misc-deliveries";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import z from "zod";
import { Delivery30dRow } from "@/modules/util/server/get30dDeliveries.orpc";

export const DeliveriesMainSection = () => {
  const deliveryQuery = useQuery(orpc.util.get30dDeliveries.queryOptions());
  const deliveryData = deliveryQuery.data;

  let rawChartData: {
    date: string;
    targets: {
      label: string;
      value: number;
    }[];
  }[] = [];

  if (deliveryData) {
    rawChartData = transformData(deliveryData);
  }

  const miscDeliveriesQuery = useQuery(
    orpc.util.get30dMiscDeliveries.queryOptions()
  );
  const miscDeliveriesData = miscDeliveriesQuery.data;

  return (
    <div className="min-h-screen w-full p-4 max-w-7xl">
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
              <span className={"text-2xl font-semibold"}>
                You have a total of{" "}
                <HighlightText
                  className="font-semibold"
                  text={`${deliveryData?.length ?? 0}`}
                />{" "}
                deliveries for last 30 days.
              </span>
            </div>
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive
                rawChartData={rawChartData}
                title={"Total Deliveries"}
              />
              {/*<ChartLineInteractive*/}
              {/*  rawChartData={rawChartData}*/}
              {/*  title={"Total Deliveries"}*/}
              {/*/>*/}
            </div>
            <DataTable3DailyDeliveries data={deliveryData} />
            <div className={"mt-4"}>
              <Separator />
              <h1 className={"text-2xl font-bold text-gray-800 mt-6"}>
                Miscellaneous Deliveries
              </h1>
            </div>
            <div>
              <span className={"text-xl font-normal"}>
                You have a total of{" "}
                <HighlightText
                  className="font-semibold"
                  text={`${miscDeliveriesData?.length ?? 0}`}
                />{" "}
                miscellaneous deliveries for last 30 days.
              </span>
            </div>
            <DataTable4MiscDeliveries data={miscDeliveriesData} />
          </div>
        </div>
      </div>
    </div>
  );
};

function transformData(data: z.infer<typeof Delivery30dRow>[]) {
  const grouped: Record<string, Record<string, number>> = {};

  data.forEach((item) => {
    const date = item.Delivery.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
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
