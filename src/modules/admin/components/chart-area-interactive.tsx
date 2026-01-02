"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { numberToHexColor } from "@/lib/hex-codes";

export const description = "An interactive area chart";

export type ChartAreaProps = {
  rawChartData: {
    date: string;
    targets: {
      label: string;
      value: number;
    }[];
  }[];
  title: string;
};

export function ChartAreaInteractive({
  rawChartData: rcd,
  title,
}: ChartAreaProps) {
  // Sort the raw data by date (oldest to newest) first
  const rawChartData = [...rcd].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // 1️⃣ Transform into chart-friendly format
  const chartData = rawChartData.map((entry) => {
    const row: Record<string, string | number> = { date: entry.date };
    entry.targets.forEach((t) => {
      row[t.label] = t.value;
    });
    return row;
  });

  // 2️⃣ Generate ChartConfig dynamically
  const chartConfig: ChartConfig = {};
  const allLabels = new Set(
    rawChartData.flatMap((entry) => entry.targets.map((t) => t.label)),
  );

  let colorIndex = 1;
  for (const label of allLabels) {
    chartConfig[label] = {
      label: label.charAt(0).toUpperCase() + label.slice(1), // Capitalize first letter
      color: `${numberToHexColor(colorIndex)}`,
    };
    colorIndex++;
  }

  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("15d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 15;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 30 days
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="15d">Last 15 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {Object.keys(chartConfig).map((key) => (
                <linearGradient
                  key={key}
                  id={`fill${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`${chartConfig[key].color}`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`${chartConfig[key].color}`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
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
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            {Object.keys(chartConfig).map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill${key})`}
                stroke={`${chartConfig[key].color}`}
                strokeWidth={2}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
