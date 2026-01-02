"use server";

import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import ErrorState from "@/components/hydration-states/error-state";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Atom } from "react-loading-indicators";
import { CustomerInformationMainSection } from "@/modules/admin/customer-information/ui/customer-info-main-section";
import { orpc } from "@/lib/orpc.server";

export default async function CustomerInformationPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      orpc.admin.customerInfo.getAllCustomers.queryOptions()
    ),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text={"Here you can manage and monitor your customers."}
        greeting="Greetings"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Atom color="#47a1f4" size="medium" />}>
          <ErrorBoundary fallback={<ErrorState />}>
            <CustomerInformationMainSection />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
