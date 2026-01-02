"use server";

import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import { DeliveriesMainSection } from "@/modules/admin/deliveries/ui/deliveries-main-section";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Atom } from "react-loading-indicators";
import ErrorState from "@/components/hydration-states/error-state";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { orpc } from "@/lib/orpc.server";

export default async function DeliveriesPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(orpc.util.get30dDeliveries.queryOptions()),
    queryClient.prefetchQuery(orpc.util.get30dMiscDeliveries.queryOptions()),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text={"Here you can manage deliveries for your platform."}
        greeting="Hello"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Atom color="#47a1f4" size="medium" />}>
          <ErrorBoundary fallback={<ErrorState />}>
            <DeliveriesMainSection />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
