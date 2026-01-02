"use client";

import { MainSectionCards } from "@/modules/admin/dashboard/ui/main-page-section-cards";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

function AdminMainSection() {
  const dashboardAnalyticsQuery = useQuery({
    ...orpc.admin.main.dashboardAnalytics.queryOptions(),
  });
  const dashboardAnalyticsData = dashboardAnalyticsQuery.data;

  if (!dashboardAnalyticsData) {
    return (
      <div className={"flex justify-center items-center"}>
        <Loader2 className={"animate-spin size-6 text-primary"} />
      </div>
    );
  }

  return (
    <div className="w-full p-4 max-w-7xl">
      <div className={"mt-6"}>
        <MainSectionCards data={dashboardAnalyticsData} />
      </div>
    </div>
  );
}

export default AdminMainSection;
