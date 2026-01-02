"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { numberToHexColor } from "@/lib/hex-codes";

export const description = "An interactive line chart";

export type ChartLineProps = {
  rawChartData: {
    date: string;
    targets: {
      label: string;
      value: number;
    }[];
  }[];
  title: string;
};

export function ChartLineInteractive({
  rawChartData: rcd,
  title,
}: ChartLineProps) {
  // Sort the raw data by date (oldest to newest) first
  const rawChartData = [...rcd].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 1️⃣ Transform into chart-friendly format
  const chartData = React.useMemo(() => {
    return rawChartData.map((entry) => {
      const row: Record<string, string | number> = { date: entry.date };
      entry.targets.forEach((t) => {
        row[t.label] = t.value;
      });
      return row;
    });
  }, [rawChartData]);

  // 2️⃣ Generate ChartConfig dynamically
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    const allLabels = new Set(
      rawChartData.flatMap((entry) => entry.targets.map((t) => t.label))
    );

    let colorIndex = 1;
    for (const label of allLabels) {
      config[label] = {
        label: label.charAt(0).toUpperCase() + label.slice(1), // Capitalize first letter
        color: `${numberToHexColor(colorIndex)}`,
      };
      colorIndex++;
    }
    return config;
  }, [rawChartData]);

  const [activeChart, setActiveChart] = React.useState<
    keyof typeof chartConfig
  >(() => Object.keys(chartConfig)[0] || "");

  // const total = React.useMemo(
  //   () => ({
  //     desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
  //     mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
  //   }),
  //   []
  // )

  const total = React.useMemo(() => {
    return Object.entries(chartConfig).reduce(
      (acc, [key]) => {
        const total = chartData.reduce((acc, curr) => {
          const val = curr[key];
          return acc + (typeof val === "number" ? val : 0);
        }, 0);
        return {
          ...acc,
          [key]: total,
        };
      },
      {} as Record<string, number>
    );
  }, [chartData, chartConfig]);

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Showing total records for the last 30 days
          </CardDescription>
        </div>
        <div className="flex">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {(total[key] || 0).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
