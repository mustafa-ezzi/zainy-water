import ErrorState from "@/components/hydration-states/error-state";
import { orpc } from "@/lib/orpc.server";
import { BottleInventoryMainSection } from "@/modules/admin/bottle-inventory/ui/bottle-inventory-main-section";
import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Atom } from "react-loading-indicators";

const BottleInventoryPage = async () => {
  const queryClient = new QueryClient();

  // Prefetch both queries in parallel for better performance
  await Promise.all([
    queryClient.prefetchQuery(orpc.util.get30dBottleUsage.queryOptions()),
    queryClient.prefetchQuery(orpc.util.getTotalBottles.queryOptions()),
    queryClient.prefetchQuery(
      orpc.admin.crudModerator.getModList.queryOptions()
    ),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text="Here you can monitor bottle usage and inventory for your platform."
        greeting="Hey there"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Atom color="#47a1f4" size="medium" />}>
          <ErrorBoundary fallback={<ErrorState />}>
            <BottleInventoryMainSection />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};
export default BottleInventoryPage;
